
import { Config } from "../config";
import { AbstractService, TwitchService } from ".";
import { Logger } from "cactus-stl";
import { RabbitHandler } from "../rabbit";
import { registered as serviceMap } from "./registry";

interface ConnectedChannels {
	[name: string]: {
		connection: ConnectionInformation;
		bot: BotInfo;
		service: AbstractService
	}
}

export class ServiceManager {
	private filter: { [key: string]: string };
	private connected: ConnectedChannels = {};

	constructor(private config: Config, private rabbit: RabbitHandler) {

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

		const bot: BotInfo =  {
			botId: 123,
			username: "CactusBotDev"
		};

		await this.connectChannel("innectic", connection, bot);
	}

	public async stop() {
		
	}

	private async connectChannel(channel: string, connection: ConnectionInformation, bot: BotInfo) {
		// See if we're filtering the name
		if (this.filter.name) {
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
		// Find the service from the name
		const serviceType = serviceMap[connection.service];
		if (!serviceType) {
			Logger.error("services", `Invalid service: ${connection.service}.`);
			return;
		}
		const service: AbstractService = new(serviceType.bind(this, connection, this.rabbit));
		await service.connect(channel, bot);

		this.connected[channel] = {
			bot,
			connection,
			service
		}
	}

	public async send(message: ProxyResponse) {
		const realChannel = message.channel.replace("#", ""); // HACK
		if (this.connected[realChannel] === undefined) {
			Logger.error("Services", "Attempted to send a message to a channel that is not connected?!")
			return;
		}
		const channel = this.connected[realChannel];
		if (channel.connection.service !== message.service) {
			return;
		}
		channel.service.send(message);
	}
}
