
const chalk = require("chalk");

import { Logger } from "cactus-stl";

import { Service } from "../../annotation";
import { AbstractService, ServiceStatus } from "..";

import { sleep } from "../../util";

import { ChatSocket, IChatMessage, IUserAuth } from "mixer-chat";
import { MixerAPI } from "./api";

@Service("Mixer")
export class MixerService extends AbstractService {
	private api: MixerAPI;
	private chat: ChatSocket;

	protected async doConnect(channel: string, bot: BotInfo): Promise<boolean> {
		this.api = new MixerAPI(this.info.auth.access);

		const channelInfo = await this.api.getChannel(channel);

		const chatInfo = await this.api.getChatEndpoints(channelInfo.id);
		if (!chatInfo) {
			return false;
		}

		const chat = new ChatSocket(chatInfo.endpoints).boot();

		let auth: IUserAuth;
		try {
			auth = await chat.auth(17887, bot.botId, chatInfo.authkey);
		} catch (e) {
			Logger.error("services", e);
			return false;
		}

		chat.on("ChatMessage", async (message: IChatMessage) => {
			const response = await this.onMessage(message, { bot, channel });
			await this.rabbit.queueChatMessage(response);
		});
		this.chat = chat;

		return true;
	}

	protected async doReconnect(): Promise<boolean> {
		const time = await this.reconnectionStrategy.next();
		console.log(`Attempting to reconnect... Waiting ${time} seconds...`);
		await sleep(time * 1000);

		return true;
	}

	protected async doDisconnect(): Promise<boolean> {
		this.chat.close();
		return true;
	}

	public async onMessage(message: IChatMessage, meta: any): Promise<ServiceMessage> {
		Logger.log("services", `<- Message(Mixer [${meta.channel}])`, chalk.green(message.user_name) + ":", chalk.magenta(message));

		const parts: string[] = [];
		for (let part of message.message.message) {
			parts.push(part.text);
		}

		const serviceMessage: ServiceMessage = {
			botInfo: meta.bot,
			channel: meta.channel,
			meta: {},
			parts,
			service: "Mixer",
			source: message.user_name
		}

		return serviceMessage;
	}

	public async send(message: ProxyResponse): Promise<void> {
		if (!message) {
			Logger.error("Mixer", "Woah this message is null what happened");
			return;
		}
		const method = message.meta.target ? "whisper" : "msg";
		await this.chat.call(method, [message.message]);
	}
}
