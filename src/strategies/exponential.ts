
import { IStrategy } from "./base";

export class ExponentialBackoffStrategy implements IStrategy {
	private backoffs = 0;

	constructor(private base = 2, private maximum = 60) {
	}

	public async next(): Promise<number> {
		return Math.min(this.base ** this.backoffs++, this.maximum);
	}
}
