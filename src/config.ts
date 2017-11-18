
export class Config {
	public stuff: string;
	public rabbitmq: {
		address: string;
		username: string;
		password: string;
		queues: {
			messages: string;
			events: string;
		}
	};
}