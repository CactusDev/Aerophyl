
const tmi = require("tmi.js");
const chalk = require("chalk");

import { Logger } from "cactus-stl";

import { Service } from "../../annotation";
import { AbstractService, ServiceStatus } from "..";

import { sleep } from "../../util";

@Service("Twitch", { single: false })
export class TwitchService extends AbstractService {
	private instance: any;

	protected async doConnect(channel: string, bot: BotInfo): Promise<boolean> {
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

			const result = await this.onMessage(message, { state, bot, source });
			await this.rabbit.queueChatMessage(result);
		});
		this.instance = instance;

		return true;
	}

	protected async doReconnect(): Promise<boolean> {
		try {
			this.instance.disconnect();
		} catch (e) {}

		const time = await this.reconnectionStrategy.next();
		console.log(`Attempting to reconnect... Waiting ${time} seconds...`);
		await sleep(time * 1000);

		console.log("Reconnecting...");
		try {
			await this.instance.connect();
		} catch (e) {
			return await this.doReconnect();
		}
		return true;
	}

	protected async doDisconnect(): Promise<boolean> {
		try {
			await this.instance.disconnect();
		} catch (e) {
			console.log("Unable to disconnect from twitch:", e);
			return false;
		}
		return true;
	}

	public async onMessage<String>(message: String, meta: any): Promise<ServiceMessage> {
		const serviceMessage: ServiceMessage = {
			botInfo: meta.bot,
			channel: meta.source,
			meta: meta.state,
			parts: message.toString().split(" "),
			service: "Twitch",
			source: meta.state["display-name"]
		};
		Logger.log("services", `<- Message(Twitch [${meta.source}])`, chalk.green(meta.state["display-name"]) + ":", chalk.magenta(message));
		return serviceMessage;
	}

	public async send(message: ProxyResponse): Promise<void> {
		if (message.meta.target) {
			this.instance.whisper(message.meta.target, message.message);
			return;
		}
		this.instance.say(message.channel, message.message);
	}
}
