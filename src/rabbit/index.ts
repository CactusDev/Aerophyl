
import { Config } from "../config";

import { EventEmitter } from "events";

import * as Amqp from "amqp-ts";

const unwanted = ["set-ts", "emotes-raw", "badges-raw", "room-id", "tmi-sent-ts", "color"];

export class RabbitHandler extends EventEmitter {
	private connection: Amqp.Connection;
	private proxyExchange: Amqp.Exchange;
	private messageQueue: Amqp.Queue;
	private incomingQueue: Amqp.Queue;

	constructor(private config: Config) {
		super();
	}

	public async connect() {
		this.connection = new Amqp.Connection(`amqp://localhost`);
		this.proxyExchange = this.connection.declareExchange("proxy");
		
		this.messageQueue = this.connection.declareQueue(this.config.rabbitmq.queues.messages);
		this.incomingQueue = this.connection.declareQueue(this.config.rabbitmq.queues.messages + "-proxy");
		
		this.messageQueue.bind(this.proxyExchange);
		this.incomingQueue.bind(this.proxyExchange);

		this.incomingQueue.activateConsumer(async message => {
			this.emit("incoming:service:message", message.getContent());
			message.ack();
		});

		await this.connection.completeConfiguration()
	}

	public async disconnect() {
		await this.connection.close();
	}

	public async queueChatMessage(message: ServiceMessage) {
		const using: any = message;
		Object.keys(using.meta).filter(key => unwanted.indexOf(key) > -1).forEach(key => delete using.meta[key]);
		const stringed = JSON.stringify(using);
		await this.messageQueue.send(new Amqp.Message(stringed));
	}
}
