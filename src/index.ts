
import { Logger } from "cactus-stl";

import "reflect-metadata";

import { Config } from "./config";
import { ServiceManager } from "./services/manager";
import { Core } from "./core";
import { RabbitHandler } from "./rabbit";

import { Injector } from "dependy";
import { CactusAPI } from "./services/platforms/api";

import * as nconf from "config";

const injector = new Injector(
	{
		injects: Config,
		value: nconf
	},
	{
		injects: CactusAPI,
		depends: [],
		create: () => new CactusAPI("http://localhost:8000")
	},
	{
		injects: ServiceManager,
		depends: [CactusAPI, Config, RabbitHandler],
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

const core: Core = injector.get(Core);
core.start();
