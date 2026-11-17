import AsyncStorage from "@react-native-async-storage/async-storage";
import ReactNativeBlobUtil from "react-native-blob-util";
import type {SessionStorage} from "./types";

const prefix = "thu-agent:";
const root = () => `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/agent-sessions-v1`;
const fileName = (key: string) => {
	const pending = key.endsWith(".pending");
	const base = pending ? key.slice(0, -8) : key;
	if (!/^chunk\/[a-f0-9]{32}\/[a-f0-9]{32}$/.test(base)) {
		throw new Error("Invalid agent storage key");
	}
	return `${root()}/${base.replace(/\//g, "_")}.json${pending ? ".pending" : ""}`;
};

/** Chunks are immutable. AsyncStorage provides the atomic, small manifest pointer. */
export const nativeSessionStorage: SessionStorage = {
	async read(key) {
		if (key.startsWith("pointer/")) {
			return AsyncStorage.getItem(prefix + key);
		}
		const file = fileName(key);
		return (await ReactNativeBlobUtil.fs.exists(file))
			? ReactNativeBlobUtil.fs.readFile(file, "utf8")
			: null;
	},
	async write(key, value) {
		if (key.startsWith("pointer/")) {
			await AsyncStorage.setItem(prefix + key, value);
			return;
		}
		if (!(await ReactNativeBlobUtil.fs.exists(root()))) {
			await ReactNativeBlobUtil.fs.mkdir(root());
		}
		const file = fileName(key);
		const temporary = file + ".pending";
		await ReactNativeBlobUtil.fs.writeFile(temporary, value, "utf8");
		await ReactNativeBlobUtil.fs.mv(temporary, file);
	},
	async remove(key) {
		if (key.startsWith("pointer/")) {
			await AsyncStorage.removeItem(prefix + key);
		} else if (await ReactNativeBlobUtil.fs.exists(fileName(key))) {
			await ReactNativeBlobUtil.fs.unlink(fileName(key));
		}
	},
	async keys() {
		const pointers = (await AsyncStorage.getAllKeys())
			.filter((key) => key.startsWith(prefix + "pointer/"))
			.map((key) => key.slice(prefix.length));
		const files = (await ReactNativeBlobUtil.fs.exists(root()))
			? await ReactNativeBlobUtil.fs.ls(root())
			: [];
		return pointers.concat(
			files
				.filter((name) => /^chunk_[a-f0-9]{32}_[a-f0-9]{32}\.json(\.pending)?$/.test(name))
				.map((name) => name.replace(".json", "").replace(/_/g, "/")),
		);
	},
};
