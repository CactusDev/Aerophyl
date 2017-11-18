
import { Logger } from "cactus-stl";

Logger.initialize();

Logger.addContainer("Core");
Logger.addContainer("Services");

import { ReflectiveInjector } from "@angular/core";
import { Config } from "./config";
import { Core } from "./core";
import { ServiceManager } from "./services/manager";

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
argumenty.parse();

const injector = ReflectiveInjector.resolveAndCreate([
	{
		provide: Config,
		useValue: nconf
	},
	{
		provide: ServiceManager,
		deps: [Config],
		useFactory: (config: Config) => {
			const filter: { [key: string]: string } = argumenty.get("filter") || {};
			return new ServiceManager(config, filter);
		}
	},
	Core
]);


const core = injector.get(Core);
core.start();
