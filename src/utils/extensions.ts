export {};

declare global {
	interface Array<T> {
		flatMap<R>(transform: (item: T) => R[]): R[];
	}

	interface Map<K, V> {
		putAll(pairs: [K, V][]): Map<K, V>;
	}
}

// eslint-disable-next-line no-extend-native
Array.prototype.flatMap = function (transform: (item: any) => any[]) {
	return this.reduce((prev, curr) => prev.concat(transform(curr)), []);
};

// eslint-disable-next-line no-extend-native
Map.prototype.putAll = function (pairs: [any, any][]) {
	pairs.forEach(([key, value]) => this.set(key, value));
	return this;
};
