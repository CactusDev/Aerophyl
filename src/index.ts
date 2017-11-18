
import { ReflectiveInjector } from "@angular/core";
import { Config } from "./config";
import { Core } from "./core";

import { TwitchService } from "./services/twitch";

import * as nconf from "config";

import "reflect-metadata";

const injector = ReflectiveInjector.resolveAndCreate([
	{
		provide: Config,
		useValue: nconf
	},
	Core
]);

/*
const core = injector.get(Core);
core.start();
*/

const twitch = new TwitchService({
	auth: {
		access: injector.get(Config).stuff
	},
	service: "Twitch"
});

async function testing() {
	await twitch.connect("innectic", {
			botId: 123,
			username: "CactusBotDev"
		});
}

testing();
