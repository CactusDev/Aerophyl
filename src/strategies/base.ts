
export interface IStrategy {
	next(): Promise<number>;
}
