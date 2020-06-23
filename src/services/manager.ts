
import { Config } from "../config";
import { AbstractService, TwitchService } from ".";
import { Logger } from "cactus-stl";
import { RabbitHandler } from "../rabbit";
import { serviceFromName } from ".";

import * as Amqp from "amqp-ts";
import { ChannelMeta, QueuedChannel } from ".";

import { CactusAPI } from "./platforms/api";

import * as moment from "moment";

interface ConnectedChannels {
	[name: string]: ChannelMeta[]
}

export class ServiceManager {
	private connected: ConnectedChannels = {};

	constructor(private cactus: CactusAPI, private config: Config, private rabbit: RabbitHandler) {
		this.rabbit.on("incoming:service:message", async (messages: Amqp.Message) => {
			const content: ProxyResponse[] = JSON.parse(messages.getContent());

			content.sort((a, b) => a.order - b.order).forEach(async item => {
				if (!this.connected[item.channel]) {
					return;
				}

				if (!this.connected[item.channel].some(meta => meta.service.name === item.service)) {
					return;
				}

				messages.ack();
				let current = content.length === 1 ? 0 : 50;
				setTimeout(async () => await this.send(item), current);
				current += 5;
			})
		});

		this.rabbit.on("incoming:queue:channel", async (message: Amqp.Message) => {
			const content: QueuedChannel = JSON.parse(message.getContent());
			message.ack();

			await this.connectChannel(content.channel, content.connection.service);
		});
	}

	public async connectChannels() {
		// TODO: Get a list of unconnected channels and connect to them.
		const channel = "innectic";
		const service = "Mixer";

		await this.connectChannel(channel, service);
	}

	public async stop() {
		Object.keys(this.connected).forEach(async name => this.connected[name].forEach(async service => {
			Logger.info("services", `Disconnecting channel ${name} from service ${service.service.name}...`);
			// Disconnect the service handler
			await service.service.disconnect();

			Logger.info("services", `Queuing channel ${name} from service ${service.service.name}...`);
			// Put the channel into the messaging queue of channels to be connected.
			await this.rabbit.queueChannelConnection({ bot: service.bot, channel: name, connection: service.connection });

			Logger.info("services", `${name} on service ${service.service.name} has been disconnected & queued!`);
		}));
	}

	private async connectChannel(channel: string, serviceName: ServiceType) {
		const serviceType = serviceFromName[serviceName];
		if (!serviceType) {
			Logger.error("services", `Invalid service: ${serviceName}.`);
			return;
		}

		const result = await this.cactus.getLastToken(channel.toLowerCase(), serviceName.toLowerCase());
		if (result == null) {
			console.log("could not get info");
			return;
		}

		const a = moment(result.expiration);
		const expires = (a.unix() - moment().utc(false).unix());
		const forceRefresh = (expires <= 0 || (expires / 60) < 10);
		console.log(forceRefresh + " " + expires + " " + (moment().utc(false).unix() - a.unix()));

		const connection: ConnectionInformation = {
			service: serviceName,
			auth: {
				access: result.access,
				refresh: result.refresh,
				expires
			}
		};

		const bot: BotInfo = {
			botId: +result.meta.bot.id,
			username: result.meta.bot.username
		};

		// TODO: Allow services (that support it) to be connected to multiple times through the use of
		// the same handler

		let service: AbstractService = new (serviceType.bind(this, channel, connection, bot, this.rabbit, this.cactus, this.config.services[serviceName.toLowerCase()]));
		await service.setup();
		
		if (forceRefresh) {
			Logger.info("services", `Force refreshing token for ${channel} before connecting.`);
			if (!(await service.reauthenticate(true))) {
				Logger.error("services", `could not reauthenticate for ${channel}`);
				return;
			}
		}
		const connectionResult = await service.connect(false);			

		if (!connectionResult) {
			Logger.error("services", `could not connect to ${channel}`);
			return;
		}

		const connected = this.connected[channel] || [];
		connected.push({
			bot,
			connection,
			service
		});
		this.connected[channel] = connected;
		await this.rabbit.queueChatMessage({ type: "event", event: "start", target: null, channel, service: connection.service, extra: { new: true } });
	}

	public async send(message: ProxyResponse) {
		if (this.connected[message.channel] === undefined) {
			Logger.error("Services", "Attempted to send a message to a channel that is not connected?!")
			return;
		}
		this.connected[message.channel].filter(chan => chan.connection.service === message.service).forEach(
			async service => await service.service.send(message));
	}
}