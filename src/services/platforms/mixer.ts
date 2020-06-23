
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

	public async setup(): Promise<void> {
		this.api = new MixerAPI(this.info.auth.access);
	}

	protected async doConnect(): Promise<boolean> {
		setTimeout(async () => {
			const reconnected = await this.reauthenticate(false);
			if (!reconnected) {
				console.error(`${this.channel}: could not reconnect.`);
				return;
			}
			Logger.info("services", `${this.channel}: reconnected and authorized.`);
		}, this.info.auth.expires * 1000);

		const channelInfo = await this.api.getChannel(this.channel);

		const chatInfo = await this.api.getChatEndpoints(channelInfo.id);
		if (!chatInfo) {
			console.error("could not get chat info");
			return false;
		}

		const chat = new ChatSocket(chatInfo.endpoints).boot();

		let auth: IUserAuth;
		try {
			auth = await chat.auth(channelInfo.id, this.bot.botId, chatInfo.authkey);
		} catch (e) {
			Logger.error("services", e);
			return false;
		}

		chat.on("ChatMessage", async (message: IChatMessage) => {
			const response = await this.onMessage(message, { });
			await this.rabbit.queueChatMessage(response);
		});
		this.chat = chat;

		return true;
	}

	protected async doReconnect(): Promise<boolean> {
		const time = await this.reconnectionStrategy.next();
		console.log(`Attempting to reconnect... Waiting ${time} seconds...`);
		await sleep(time * 1000);

		const result = await this.reauthenticate(false);
		if (!result) {
			console.error("could not reauthenticate with Mixer.");
			return false;
		}

		return true;
	}

	protected async doDisconnect(): Promise<boolean> {
		this.chat.close();
		return true;
	}

	public async reauthenticate(skip: boolean): Promise<boolean> {
		if (!this.client || !this.info.auth.refresh) {
			// If we don't have a refresh token, this is super bad and we have to drop this channel.
			console.error("no client or no refresh token");
			return false;
		}
		// In the case that we do have the refresh token, lets do it.
		const result = await this.api.refreshToken(this.client, this.info.auth.refresh);
		if (result == null) {
			console.error("could not refresh token");
			return false;
		}

		const updateResult = await this.cactus.updateToken(this.channel, this.info.service, {
			access: result.access_token,
			expiration: result.expires_in,
			refresh: result.refresh_token
		});
		if (!updateResult) {
			console.error("could not update token");
			return false;
		}

		this.info.auth.access = result.access_token;
		this.info.auth.refresh = result.refresh_token;
		this.info.auth.expires = result.expires_in;

		if (!skip) {
			this.chat.close();
			return await this.connect(true);
		}
		return true;
	}

	public async onMessage(message: IChatMessage, meta: any): Promise<ServiceMessage> {
		Logger.info("services", `<- Message(Mixer [${this.channel}])`, chalk.green(message.user_name) + ":", chalk.magenta(message));

		const parts: string[] = message.message.message.map(message => message.text);

		const serviceMessage: ServiceMessage = {
			type: "message",
			botInfo: this.bot,
			channel: this.channel,
			meta: {
				role: message.user_roles[0],
				action: message.message.meta.me || false,
				target: message.message.meta.whisper || undefined
			},
			parts,
			service: "Mixer",
			source: message.user_name
		};
		return serviceMessage;
	}

	public async send(message: ProxyResponse): Promise<void> {
		if (!message) {
			Logger.error("Mixer", "Woah this message is null what happened");
			return;
		}
		let method = "msg";
		let args = [message.message];
		if (!!message.meta.target) {
			method = "whisper";
			args = [message.meta.target, message.message];
		}

		await this.chat.call(method, args);
	}
}
