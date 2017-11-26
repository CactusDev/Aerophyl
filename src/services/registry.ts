
import { AbstractService, TwitchService, MixerService } from ".";

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
	Twitch: TwitchService,
	Mixer: MixerService
};

export const singleInstances: SingleInstanceServices = {
	Twitch: null
}
