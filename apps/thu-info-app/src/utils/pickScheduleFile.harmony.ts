// Do not evaluate the Android/iOS native module in HarmonyOS bundles.
export async function pickScheduleFile(): Promise<{
	name: string;
	text: string;
} | null> {
	throw new Error("Schedule file import is unavailable on HarmonyOS");
}
