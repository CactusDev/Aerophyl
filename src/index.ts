
import { Logger } from "cactus-stl";

Logger.initialize();

Logger.addContainer("Core");
Logger.addContainer("Services");

import { ReflectiveInjector } from "@angular/core";
import { Config } from "./config";
import { ServiceManager } from "./services/manager";
import { Core } from "./core";

import { Argumenty, ParsedArgument } from "argumenty";

import * as nconf from "config";

import "reflect-metadata";

const argumenty = new Argumenty(
	{ short: "f", long: "filter", type: "string", transformer: (argument: ParsedArgument) => {
		// Turn the raw argument into JSON.
		try {
			return JSON.parse(argument.value);
		} catch (e) {
			console.error("Provided filter isn't valid.");
			return null;
		}
	}}
);

const injector = ReflectiveInjector.resolveAndCreate([
	{
		provide: Config,
		useValue: nconf
	},
	{
		provide: ServiceManager,
		deps: [Config],
		useFactory: (config: Config) => {
			return new ServiceManager(config);
		}
	},
	{
		provide: Core,
		deps: [ServiceManager],
		useFactory: (manager: ServiceManager) => {
			return new Core(manager);
		}
	}
]);

argumenty.parse();
const filter: { [key: string]: string } = argumenty.get("filter") || {};

const core: Core = injector.get(Core);
core.start(filter);
