
import { AbstractService, TwitchService } from ".";

// TODO: General cleanup
// TODO: General cleanup
// TODO: General cleanup
// TODO: General cleanup
// TODO: General cleanup
// TODO: General cleanup
// TODO: General cleanup
// TODO: General cleanup
// TODO: General cleanup
// TODO: General cleanup
// TODO: General cleanup
// TODO: General cleanup
// TODO: General cleanup
// TODO: General cleanup

interface RegisteredServices {
	[name: string]: typeof AbstractService;
}

interface SingleInstanceServices {
	[name: string]: AbstractService
}

export const registered: RegisteredServices = {
	Twitch: TwitchService
};

export const singleInstances: SingleInstanceServices = {
	Twitch: null
}
