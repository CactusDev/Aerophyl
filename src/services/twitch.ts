
const tmi = require("tmi");

import { Service } from "../annotation";
import { AbstractService } from "./base";
import { ServiceStatus } from "./status";

@Service("Twitch")
export class TwitchService extends AbstractService {

	public async connect(channel: string, bot: BotInfo) {

	}

	public async reconnect(): Promise<boolean> {
		return true;
	}

	public async disconnect(): Promise<boolean> {
		return true;
	}

	public async onMessage<String>(message: String): Promise<ServiceMessage> {
		return null;
	}
}
