
import { Config } from "../config";
import { QueuedChannel } from "../services";

import { EventEmitter } from "events";
import * as Amqp from "amqp-ts";

export class RabbitHandler extends EventEmitter {
	private connection: Amqp.Connection;

	private proxyExchange: Amqp.Exchange;

	private messageQueue: Amqp.Queue;
	private incomingQueue: Amqp.Queue;
	private channelQueue: Amqp.Queue;

	private isDisconnecting = false;

	constructor(private config: Config) {
		super();
	}

	public async connect() {
		this.connection = new Amqp.Connection(`amqp://${this.config.rabbitmq.host}:${this.config.rabbitmq.port}`);
		this.proxyExchange = this.connection.declareExchange("proxy");
		
		this.messageQueue = this.connection.declareQueue(this.config.rabbitmq.queues.messages);
		this.incomingQueue = this.connection.declareQueue(this.config.rabbitmq.queues.messages + "-proxy");
		this.channelQueue = this.connection.declareQueue(this.config.rabbitmq.queues.channels);

		[this.messageQueue, this.incomingQueue, this.channelQueue]
			.forEach(q => q.bind(this.proxyExchange))

		this.incomingQueue.activateConsumer(async messages => {
			if (this.isDisconnecting) {
				return;
			}
			messages.ack();
			this.emit("incoming:service:message", messages);
		});

		this.channelQueue.activateConsumer(async message => {
			if (this.isDisconnecting) {
				return;
			}
			message.ack();
			this.emit("incoming:queue:channel", message);
		});

		await this.connection.completeConfiguration();
	}

	public async disconnect(): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			// Make sure we don't spend over 5 seconds here
			setTimeout(() => resolve(), 5000);

			this.connection.close().then(() => resolve());
		});
	}

	public async queueChatMessage(message: ServiceMessage | ServiceEvent) {
		if (!message) {
			console.error("Unable to queue message into Rabbit.");
			return;
		}
		await this.messageQueue.send(new Amqp.Message(JSON.stringify(message)));
	}

	public async queueChannelConnection(channel: QueuedChannel) {
		await this.channelQueue.send(new Amqp.Message(JSON.stringify(channel)));
	}

	public set disconnecting(isDisconnecting: boolean) {
		this.isDisconnecting = isDisconnecting;
	}
}
