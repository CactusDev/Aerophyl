
export class Config {
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