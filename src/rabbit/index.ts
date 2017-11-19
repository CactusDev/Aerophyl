
import { Config } from "../config";

import * as Amqp from "amqp-ts";

const unwanted = ["set-ts", "emotes-raw", "badges-raw", "room-id", "tmi-sent-ts", "color"];

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
		const using: any = message;
		Object.keys(using.meta).filter(key => unwanted.indexOf(key) > -1).forEach(key => delete using.meta[key]);
		const stringed = JSON.stringify(using);
		await this.proxyExchange.send(new Amqp.Message(stringed));
	}
}
