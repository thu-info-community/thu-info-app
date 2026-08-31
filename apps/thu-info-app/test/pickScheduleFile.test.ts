import {pick, keepLocalCopy} from "@react-native-documents/picker";
import ReactNativeBlobUtil from "react-native-blob-util";
import {pickScheduleFile} from "../src/utils/pickScheduleFile.native";

jest.mock("react-native-blob-util", () => ({
	__esModule: true,
	default: {fs: {stat: jest.fn(), readFile: jest.fn(), unlink: jest.fn()}},
}));

beforeEach(() => {
	jest.clearAllMocks();
	jest
		.mocked(pick)
		.mockResolvedValue([
			{name: "Weekend.ICS", size: 100, uri: "content://provider/weekend"},
		] as never);
	jest
		.mocked(keepLocalCopy)
		.mockResolvedValue([
			{
				status: "success",
				sourceUri: "content://provider/weekend",
				localUri: "file:///cache/import.ics",
			},
		]);
	jest
		.mocked(ReactNativeBlobUtil.fs.stat)
		.mockResolvedValue({size: 100} as never);
	jest
		.mocked(ReactNativeBlobUtil.fs.readFile)
		.mockResolvedValue("BEGIN:VCALENDAR");
	jest.mocked(ReactNativeBlobUtil.fs.unlink).mockResolvedValue(undefined);
});

it("reads a copied content URI and removes the temporary file", async () => {
	expect(await pickScheduleFile()).toEqual({
		name: "Weekend.ICS",
		text: "BEGIN:VCALENDAR",
	});
	expect(ReactNativeBlobUtil.fs.readFile).toHaveBeenCalledWith(
		"/cache/import.ics",
		"utf8",
	);
	expect(ReactNativeBlobUtil.fs.unlink).toHaveBeenCalledWith(
		"/cache/import.ics",
	);
});
it("treats cancellation as no selection", async () => {
	jest.mocked(pick).mockRejectedValue({code: "OPERATION_CANCELED"});
	expect(await pickScheduleFile()).toBeNull();
	expect(keepLocalCopy).not.toHaveBeenCalled();
});
it("checks the copy status rather than only promise resolution", async () => {
	jest
		.mocked(keepLocalCopy)
		.mockResolvedValue([
			{
				status: "error",
				sourceUri: "content://provider/weekend",
				copyError: "offline",
			},
		]);
	await expect(pickScheduleFile()).rejects.toThrow("File copy failed");
	expect(ReactNativeBlobUtil.fs.readFile).not.toHaveBeenCalled();
});
it("checks actual file size and still cleans up on failure", async () => {
	jest
		.mocked(ReactNativeBlobUtil.fs.stat)
		.mockResolvedValue({size: 6 * 1024 * 1024} as never);
	await expect(pickScheduleFile()).rejects.toMatchObject({
		code: "fileTooLarge",
	});
	expect(ReactNativeBlobUtil.fs.readFile).not.toHaveBeenCalled();
	expect(ReactNativeBlobUtil.fs.unlink).toHaveBeenCalled();
});
it("does not select spreadsheet files in the ICS-only release", async () => {
	jest.mocked(pick).mockResolvedValue([{name: "table.csv", size: 10}] as never);
	await expect(pickScheduleFile()).rejects.toMatchObject({code: "invalidFile"});
	expect(keepLocalCopy).not.toHaveBeenCalled();
});
