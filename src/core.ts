
import { Logger } from "cactus-stl";

import { Config } from "./config";
import { ServiceManager } from "./services/manager";
import { RabbitHandler } from "./rabbit";

export class Core {

	constructor(private manager: ServiceManager, private rabbit: RabbitHandler) {

	}

	public async start(filter: { [key: string]: string }) {
		process.on("SIGINT", () => this.stop());
		process.on("SIGTERM", () => this.stop());

		await this.rabbit.connect();
		Logger.info("services", "Connecting to available channels...");
		await this.manager.connectChannels(filter);
	}

	public async stop() {
		this.rabbit.disconnecting = true;
		// Tell the channel manager to stop
		Logger.info("services", "Disconnecting channels...");
		await this.manager.stop();
		Logger.info("services", "Disconnected from channels!");

		// Disconnect from Rabbit
		Logger.info("core", "Disconnecting from Rabbit...");
		await this.rabbit.disconnect();
		Logger.info("core", "Disconnected from Rabit!");

		process.exit(0);
	}
}