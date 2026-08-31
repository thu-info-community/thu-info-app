/** Fallback for TypeScript and platforms without the native file picker. */
export async function pickScheduleFile(): Promise<{
	name: string;
	text: string;
} | null> {
	throw new Error("Schedule file import is unavailable on this platform");
}
