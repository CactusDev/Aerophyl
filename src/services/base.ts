
import { ServiceStatus } from ".";
import { IStrategy, ExponentialBackoffStrategy } from "../strategies";
import { RabbitHandler } from "../rabbit";

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
	private _name: string;
	private _single: boolean;

	constructor(protected info: ConnectionInformation, protected rabbit: RabbitHandler, protected reconnectionStrategy = new ExponentialBackoffStrategy()) {

	}

	public async connect(channel: string, bot: BotInfo) {
		if (this.status !== ServiceStatus.NONE && this.single) {
			Logger.error("services", `Attempted to create a new ${this.name} handler, but this is a single instance!`);
			return false;
		}
		// Not already attempting to connect, so actually connect.
		const connected = await this.doConnect(channel, bot);
		if (!connected) {
			Logger.info("services", `Unable to connect to channel ${channel} on service ${name} as user ${bot.username}`);
			return;
		}
		this.status = ServiceStatus.CONNECTED;
		Logger.info("services", `Connected to channel ${channel} on service ${this.name} as user ${bot.username}`);
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

	protected abstract async doConnect(channel: string, bot: BotInfo): Promise<boolean>;
	protected abstract async doReconnect(): Promise<boolean>;
	protected abstract async doDisconnect(): Promise<boolean>;

	public abstract async onMessage(message: any, meta: any): Promise<ServiceMessage>;

	public abstract async send(message: ProxyResponse): Promise<void>;

	public set status(status: ServiceStatus) {
		console.log(`Service status changed to ${ServiceStatus[status]} from ${ServiceStatus[this.status]}`);
		this._status = status;
	};

	public get status(): ServiceStatus {
		return this._status;
	}

	public get name(): string {
		return this._name;
	}

	public set name(name: string) {
		this._name = name;
	}

	public get single(): boolean {
		return this._single;
	}

	public set single(single: boolean) {
		this._single = single;
	}
}
