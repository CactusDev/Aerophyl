
import { ServiceStatus } from "./status";
import { IStrategy, ExponentialBackoffStrategy } from "../strategies";

export abstract class AbstractService {
	protected status: ServiceStatus = ServiceStatus.NONE;

	constructor(protected info: ConnectionInformation, protected reconnectionStrategy = new ExponentialBackoffStrategy()) {

	}

	public async connect(channel: string, bot: BotInfo): Promise<boolean> {
		if (this.status >= ServiceStatus.CONNECTING) {
			return false;
		}
		// Not already attempting to connect, so actually connect.
		const connected = await this.doConnect(channel, bot);
		if (!connected) {
			return false;
		}
		this.status = ServiceStatus.CONNECTED;
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

	public abstract async onMessage<T>(message: T): Promise<ServiceMessage>;

	public setStatus(status: ServiceStatus) {
		console.log(`Service status changed to ${ServiceStatus[status]} from ${ServiceStatus[this.status]}`);
		this.status = status;
	};
}
