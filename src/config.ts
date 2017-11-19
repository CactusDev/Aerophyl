
export class Config {
	public stuff: string;
	public rabbitmq: {
		host: string;
		port: number;
		username: string;
		password: string;
		queues: {
			messages: string;
			events: string;
		}
	};
}