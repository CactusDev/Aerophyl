
const tmi = require("tmi.js");

import { Service } from "../annotation";
import { AbstractService } from "./base";
import { ServiceStatus } from "./status";

@Service("Twitch")
export class TwitchService extends AbstractService {
	private instance: any;

	public async doConnect(channel: string, bot: BotInfo): Promise<boolean> {
		const options = {
			connection: {
				reconnect: false
			},
			identity: {
				username: bot.botId,
				password: `oauth:${this.info.auth.access}`
			},
			channels: [channel]
		}

		const instance = new tmi.client(options);
		try {
			await instance.connect();
		} catch (e) {
			console.error("Unable to connect to Twitch:", e);
			return false;
		}

		instance.on("message", async (source: string, state: any, message: string, self: boolean) => {
			if (self) {
				return;
			}

			const serviceMessage: ServiceMessage = {
				botInfo: bot,
				channel: source,
				meta: state,
				parts: message.split(" "),
				service: "Twitch",
				source: state["display-name"]
			};
			console.log(JSON.stringify(serviceMessage));
		});
		this.instance = instance;

		return true;
	}

	public async doReconnect(): Promise<boolean> {
		return true;
	}

	public async doDisconnect(): Promise<boolean> {
		try {
			await this.instance.disconnect();
		} catch (e) {
			console.log("Unable to disconnect from twitch:", e);
			return false;
		}
		return true;
	}

	public async onMessage<String>(message: String): Promise<ServiceMessage> {
		return null;
	}
}
