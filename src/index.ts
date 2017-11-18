
import { ReflectiveInjector } from "@angular/core";
import { Config } from "./config";
import { Core } from "./core";

import { ExponentialBackoffStrategy } from "./strategies";

import * as nconf from "config";

import "reflect-metadata";

const injector = ReflectiveInjector.resolveAndCreate([
	{
		provide: Config,
		useValue: nconf
	},
	Core
]);

const core = injector.get(Core);
core.start();
