
import { ServiceStatus } from ".";
import { IStrategy, ExponentialBackoffStrategy } from "../strategies";
import { RabbitHandler } from "../rabbit";
import { CactusAPI } from "./platforms/api";

import { Logger } from "cactus-stl";

export interface ChannelMeta {
	connection: ConnectionInformation;
	bot: BotInfo;
	service: AbstractService;
}

export interface QueuedChannel {
	channel: string;
	bot: BotInfo;
	connection: ConnectionInformation
}

export abstract class AbstractService {
	protected _status: ServiceStatus = ServiceStatus.NONE;
	protected reconnectionStrategy = new ExponentialBackoffStrategy();
	public name: string;
	public single: boolean;

	constructor(protected channel: string, protected info: ConnectionInformation, protected bot: BotInfo, protected rabbit: RabbitHandler, protected cactus: CactusAPI, protected client?: OAuthClient) {
	}

	public async connect(reconnecting: boolean): Promise<boolean> {
		if (reconnecting) {
			Logger.info("services", `Reconnecting to ${this.channel}`);
			this.status = ServiceStatus.RECONNECTING;
		} else if (this.status !== ServiceStatus.NONE && this.single) {
			Logger.error("services", `Attempted to create a new ${this.name} handler, but this is a single instance!`);
			return false;
		}
		// Not already attempting to connect, so actually connect.
		const connected = await this.doConnect();
		if (!connected) {
			Logger.info("services", `Unable to connect to channel ${this.channel} on service ${name} as user ${this.bot.username}`);
			return false;
		}
		this.status = ServiceStatus.CONNECTED;
		Logger.info("services", `Connected to channel ${this.channel} on service ${this.name} as user ${this.bot.username}`);
		return true;
	}

	public async reconnect(): Promise<boolean> {
		this.status = ServiceStatus.RECONNECTING;
		return await this.doReconnect();
	}

	public async disconnect(): Promise<boolean> {
		if (this.status !== ServiceStatus.READY) {
			return false;
		}
		return await this.disconnect();
	}

	public abstract async setup(): Promise<void>;
	protected abstract async doConnect(): Promise<boolean>;
	protected abstract async doReconnect(): Promise<boolean>;
	protected abstract async doDisconnect(): Promise<boolean>;
	public abstract async reauthenticate(skip: boolean): Promise<boolean>;

	public abstract async onMessage(message: any, meta: any): Promise<ServiceMessage>;

	public abstract async send(message: ProxyResponse): Promise<void>;

	public set status(status: ServiceStatus) {
		console.log(`Service status changed to ${ServiceStatus[status]} from ${ServiceStatus[this.status]}`);
		this._status = status;
	};

	public get status(): ServiceStatus {
		return this._status;
	}
}
