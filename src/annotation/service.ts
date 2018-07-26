
import { ServiceStatus } from "../services";

import { Logger } from "cactus-stl";

export interface ServiceOptions {
	single?: boolean;
}

export function Service(name: string, options?: ServiceOptions) {
	return (target: Function) => {
		target.prototype.single = (options || {}).single || true;
		target.prototype.name = name;

		Logger.info("core", `Registered service '${name}'!`);
	}
}
