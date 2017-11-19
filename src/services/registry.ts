
import { AbstractService, TwitchService } from ".";

interface RegisteredServices {
	[name: string]: typeof AbstractService
}

export let registered: RegisteredServices = {
	Twitch: TwitchService
};
