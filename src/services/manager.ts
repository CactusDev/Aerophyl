
import { Config } from "../config";
import { AbstractService, TwitchService } from ".";
import { Logger } from "cactus-stl";
import { RabbitHandler } from "../rabbit";
import { serviceFromName } from ".";

import * as Amqp from "amqp-ts";
import { ChannelMeta, QueuedChannel } from ".";

interface ConnectedChannels {
	[name: string]: ChannelMeta[]
}

export class ServiceManager {
	private filter: { [key: string]: string };
	private connected: ConnectedChannels = {};

	constructor(private config: Config, private rabbit: RabbitHandler) {
		this.rabbit.on("incoming:service:message", async (message: Amqp.Message) => {
			const content: ProxyResponse = JSON.parse(message.getContent());

			console.log("A");
			if (!this.connected[content.channel]) {
				return;
			}
			console.log("A " + this.connected[content.channel][0].service.name + " " + content.service);

			if (!this.connected[content.channel].some(meta => meta.service.name === content.service)) {
				return;
			}
			console.log("A");

			message.ack();
			console.log("A");
			await this.send(content);
			console.log("A");
		});

		this.rabbit.on("incoming:queue:channel", async (message: Amqp.Message) => {
			const content: QueuedChannel = JSON.parse(message.getContent());
			message.ack();

			await this.connectChannel(content.channel, content.connection, content.bot);
		});
	}

	public async connectChannels(filter: { [key: string]: string }) {
		this.filter = filter;
		// Temp things for testing
		// let connection: ConnectionInformation = {
		// 	service: "Twitch",
		// 	auth: {
		// 		access: this.config.stuff
		// 	}
		// };

		let connection: ConnectionInformation = {
			service: "Mixer",
			auth: {
				access: this.config.otherstuff
			}
		};

		let bot: BotInfo = {
			botId: 25873,
			username: "CactusBotDev"
		};
		await this.connectChannel("innectic", connection, bot);
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

	private async connectChannel(channel: string, connection: ConnectionInformation, bot: BotInfo) {
		// See if we're filtering the name
		if (this.filter && this.filter.name) {
			// Since we're filtering the name of the channels we can connect to, lets
			// see if the current channels name matches the regex.
			const regex = new RegExp(this.filter.name);
			// See if it matches
			const results = regex.exec(channel);
			if (!results || results.length < 1) {
				// Not a match, get out.
				return;
			}
		}

		const serviceType = serviceFromName[connection.service];
		if (!serviceType) {
			Logger.error("services", `Invalid service: ${connection.service}.`);
			return;
		}

		// TODO: Allow services (that support it) to be connected to multiple times through the use of
		// the same handler

		let service: AbstractService = new (serviceType.bind(this, connection, this.rabbit));
		await service.connect(channel, bot);

		const connected = this.connected[channel] || [];
		connected.push({
			bot,
			connection,
			service
		});
		this.connected[channel] = connected;
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