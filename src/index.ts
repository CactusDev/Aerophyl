
import { Logger } from "cactus-stl";

Logger.initialize();

Logger.addContainer("Core");
Logger.addContainer("Services");

import "reflect-metadata";

import { ReflectiveInjector } from "@angular/core";
import { Config } from "./config";
import { ServiceManager } from "./services/manager";
import { Core } from "./core";
import { RabbitHandler } from "./rabbit";

import { Argumenty, ParsedArgument } from "argumenty";

import * as nconf from "config";

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
		deps: [Config, RabbitHandler],
		useFactory: (config: Config, rabbit: RabbitHandler) => {
			return new ServiceManager(config, rabbit);
		}
	},
	{
		provide: RabbitHandler,
		deps: [Config],
		useFactory: (config: Config) => {
			return new RabbitHandler(config);
		}
	},
	{
		provide: Core,
		deps: [ServiceManager, RabbitHandler],
		useFactory: (manager: ServiceManager, rabbit: RabbitHandler) => {
			return new Core(manager, rabbit);
		}
	}
]);

argumenty.parse();
const filter: { [key: string]: string } = argumenty.get("filter") || {};

const core: Core = injector.get(Core);
core.start(filter);
