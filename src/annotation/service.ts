
import { ServiceStatus } from "../services/status";

export function Service(serviceName: string) {
	return (target: Function) => {
		console.log("this is a service", serviceName);
	}
}
