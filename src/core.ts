
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
		Logger.log("services", "Connecting to available channels...");
		await this.rabbit.connect();

		this.rabbit.on("incoming:service:message", async (message: string) => {
			const msg: ProxyResponse = JSON.parse(message);
			await this.manager.send(msg);
		});

		await this.manager.connectChannels(filter);
	}
}