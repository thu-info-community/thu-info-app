export {};

declare global {
	interface Date {
		format(): string;
	}

	interface String {
		format(...args: any[]): string;
	}
}
