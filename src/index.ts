
import { Logger } from "cactus-stl";

import "reflect-metadata";

import { Config } from "./config";
import { ServiceManager } from "./services/manager";
import { Core } from "./core";
import { RabbitHandler } from "./rabbit";

import { Argumenty, ParsedArgument } from "argumenty";
import { Injector } from "dependy";

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

const injector = new Injector(
	{
		injects: Config,
		value: nconf
	},
	{
		injects: ServiceManager,
		depends: [Config, RabbitHandler],
	},
	{
		injects: RabbitHandler,
		depends: [Config],
	},
	{
		injects: Core,
		depends: [ServiceManager, RabbitHandler],
	}
);

argumenty.parse();
const filter: { [key: string]: string } = argumenty.get("filter") || {};

const core: Core = injector.get(Core);
core.start(filter);
