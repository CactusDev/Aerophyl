
import { Injectable } from "@angular/core"
import { Logger } from "cactus-stl";

import { Config } from "./config";
import { ServiceManager } from "./services/manager";

@Injectable()
export class Core {

	constructor(private manager: ServiceManager) {

	}

	public async start() {
		Logger.log("Services", "Connecting to available channels...");
		await this.manager.connectChannels();
	}
}