import {
	keepLocalCopy,
	pick,
	isErrorWithCode,
	errorCodes,
	types,
} from "@react-native-documents/picker";
import ReactNativeBlobUtil from "react-native-blob-util";
import {IMPORT_LIMITS, ScheduleImportError} from "./scheduleImport";

export async function pickScheduleFile(): Promise<{
	name: string;
	text: string;
} | null> {
	let path: string | undefined;
	try {
		// Some Android providers mislabel ICS as text/plain or octet-stream.
		// Validate both extension and parsed content instead of trusting MIME.
		const [file] = await pick({
			mode: "import",
			allowMultiSelection: false,
			type: [types.allFiles],
		});
		if (!file.name || !/\.ics$/i.test(file.name)) {
			throw new ScheduleImportError("invalidFile");
		}
		if (file.size !== null && file.size > IMPORT_LIMITS.bytes) {
			throw new ScheduleImportError("fileTooLarge");
		}
		const [copy] = await keepLocalCopy({
			destination: "cachesDirectory",
			files: [
				{
					uri: file.uri,
					fileName: `thuinfo-import-${Date.now()}.ics`,
				},
			],
		});
		if (copy.status !== "success") {
			throw new Error("File copy failed");
		}
		path = decodeURIComponent(copy.localUri.replace(/^file:\/\//, ""));
		const stat = await ReactNativeBlobUtil.fs.stat(path);
		if (Number(stat.size) > IMPORT_LIMITS.bytes) {
			throw new ScheduleImportError("fileTooLarge");
		}
		return {
			name: file.name,
			text: await ReactNativeBlobUtil.fs.readFile(path, "utf8"),
		};
	} catch (error) {
		if (
			isErrorWithCode(error) &&
			error.code === errorCodes.OPERATION_CANCELED
		) {
			return null;
		}
		throw error;
	} finally {
		if (path) {
			await ReactNativeBlobUtil.fs.unlink(path).catch(() => {});
		}
	}
}
