
import { Config } from "../config";

import * as Amqp from "amqp-ts";

export class RabbitHandler {
	private connection: Amqp.Connection;
	private proxyExchange: Amqp.Exchange;
	private messageQueue: Amqp.Queue;

	constructor(private config: Config) {

	}

	public async connect() {
		this.connection = new Amqp.Connection(`amqp://localhost`);
		this.proxyExchange = this.connection.declareExchange("proxy");
		this.messageQueue = this.connection.declareQueue(this.config.rabbitmq.queues.messages);
		this.messageQueue.bind(this.proxyExchange);

		await this.connection.completeConfiguration()
	}

	public async disconnect() {
		await this.connection.close();
	}

	public async queueChatMessage(message: ServiceMessage) {
		const stringed = JSON.stringify(message);
		await this.proxyExchange.send(new Amqp.Message(stringed));
	}
}
