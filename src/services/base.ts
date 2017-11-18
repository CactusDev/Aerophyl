
import { ServiceStatus } from "./status";
import { IStrategy, ExponentialBackoffStrategy } from "../strategies";

export abstract class AbstractService {
	private status: ServiceStatus = ServiceStatus.NONE;

	constructor(private info: ConnectionInformation, private reconnectionStrategy = new ExponentialBackoffStrategy()) {

	}

	public abstract async connect(channel: string, bot: BotInfo): Promise<void>;
	public abstract async reconnect(): Promise<boolean>;
	public abstract async disconnect(): Promise<boolean>;

	public abstract async onMessage<T>(message: T): Promise<ServiceMessage>;

	public setStatus(status: ServiceStatus) {
		console.log(`Service status changed to ${ServiceStatus[status]} from ${ServiceStatus[this.status]}`);
		this.status = status;
	};
}
