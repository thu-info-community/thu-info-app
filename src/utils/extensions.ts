export {};

declare global {
	interface Array<T> {
		flatMap<R>(transform: (item: T) => R[]): R[];
	}

	interface Map<K, V> {
		putAll(pairs: [K, V][]): Map<K, V>;
	}
}

Array.prototype.flatMap = function (transform: (item: any) => any[]) {
	return this.reduce((prev, curr) => prev.concat(transform(curr)), []);
};

Map.prototype.putAll = function (pairs: [any, any][]) {
	pairs.forEach(([key, value]) => this.set(key, value));
	return this;
};
