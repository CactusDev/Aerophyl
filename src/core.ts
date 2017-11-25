
import { Injectable } from "@angular/core"
import { Logger } from "cactus-stl";

import { Config } from "./config";
import { ServiceManager } from "./services/manager";
import { RabbitHandler } from "./rabbit";

@Injectable()
export class Core {

	constructor(private manager: ServiceManager, private rabbit: RabbitHandler) {

	}

	public async start(filter: { [key: string]: string }) {
		process.on("SIGINT", () => this.stop());
		process.on("SIGTERM", () => this.stop());

		Logger.log("services", "Connecting to available channels...");
		await this.rabbit.connect();
		await this.manager.connectChannels(filter);
	}

	public async stop() {
		this.rabbit.disconnecting = true;
		// Tell the channel manager to stop
		Logger.log("services", "Disconnecting channels...");
		await this.manager.stop();
		Logger.log("services", "Disconnected from channels!");

		// Disconnect from Rabbit
		Logger.log("core", "Disconnecting from Rabbit...");
		await this.rabbit.disconnect();
		Logger.log("core", "Disconnected from Rabit!");

		process.exit(0);
	}
}