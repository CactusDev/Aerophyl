
import { Config } from "../config";
import { AbstractService, TwitchService } from ".";
import { Logger } from "cactus-stl";
import { RabbitHandler } from "../rabbit";
import { registered as serviceMap, singleInstances } from "./registry";

import { ChannelMeta, QueuedChannel } from ".";

interface ConnectedChannels {
	[name: string]: ChannelMeta[]
}

export class ServiceManager {
	private filter: { [key: string]: string };
	private connected: ConnectedChannels = {};

	constructor(private config: Config, private rabbit: RabbitHandler) {
		this.rabbit.on("incoming:service:message", async (message: string) => {
			const msg: ProxyResponse = JSON.parse(message);
			await this.send(msg);
		});

		this.rabbit.on("incoming:queue:channel", async (message: string) => {
			const channel: QueuedChannel = JSON.parse(message);
			await this.connectChannel(channel.channel, channel.connection, channel.bot);
		});
	}

	public async connectChannels(filter: { [key: string]: string }) {
		this.filter = filter;
		// Temp things for testing
		const connection: ConnectionInformation = {
			service: "Twitch",
			auth: {
				access: this.config.stuff
			}
		};

		const bot: BotInfo = {
			botId: 123,
			username: "CactusBotDev"
		};

		// await this.connectChannel("cactusbotdev", connection, bot);
	}

	public async stop() {
		for (let name of Object.keys(this.connected)) {
			for (let service of this.connected[name]) {
				Logger.log("services", `Disconnecting channel ${name} from service ${service.service.name}...`);
				// Disconnect the service handler
				await service.service.disconnect();

				Logger.log("services", `Queuing channel ${name} from service ${service.service.name}...`);
				// Put the channel into the messaging queue of channels to be connected.
				await this.rabbit.queueChannelConnection({ bot: service.bot, channel: name, connection: service.connection });

				Logger.log("services", `${name} on service ${service.service.name} has been disconnected & queued!`);
			}
		}
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

		let service: AbstractService = null;

		const serviceType = serviceMap[connection.service];
		if (!serviceType) {
			Logger.error("services", `Invalid service: ${connection.service}.`);
			return;
		}

		if (singleInstances[connection.service] === null) {
			const serviceHandler = singleInstances[connection.service];
			if (!serviceHandler) {
				service = new (serviceType.bind(this, connection, this.rabbit));
				singleInstances[connection.service] = service;

				await service.connect(channel, bot);
			}
		} else {
			service = new (serviceType.bind(this, connection, this.rabbit));
			await service.connect(channel, bot);
		}
		if (!service) {
			Logger.error("services", `Service for channel ${channel} on service ${service.name} was never created!`);
			return;
		}
		// Find the service from the name
		this.connected[channel] = [
			{
				bot,
				connection,
				service
			}
		]
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