
export * from "./base";
export * from "./manager";
export * from "./platforms";

import * as Services from "./platforms";
import { AbstractService } from "./base";

export const serviceFromName: {[key: string]: typeof AbstractService} = {
	"Twitch": Services.TwitchService,
	"Glimesh": Services.GlimeshService
};

export enum ServiceStatus {
	NONE,
	CONNECTING,
	CONNECTION_FAILED,
	CONNECTED,
	AUTHENTICATING,
	AUTHENTICATION_FAILED,
	RECONNECTING,
	RECONNECTION_FAILED,
	DISCONNECTED,
	READY
};
