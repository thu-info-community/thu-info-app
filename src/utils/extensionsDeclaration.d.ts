export {};

declare global {
	interface Array<T> {
		flatMap<R>(transform: (item: T, index: number) => R[]): R[];
	}

	interface Map<K, V> {
		putAll(pairs: [K, V][]): Map<K, V>;
	}

	interface Date {
		format(): string;
	}
}
