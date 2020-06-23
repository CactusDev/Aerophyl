
export class Config {
	public identifier: string;
	public rabbitmq: {
		host: string;
		port: number;
		username: string;
		password: string;
		queues: {
			messages: string;
			events: string;
			channels: string;
			event: string;
		}
	};
	public services: {[key: string]: OAuthClient};
}