import {expect, jest, test} from "@jest/globals";
import {transformSync} from "@babel/core";
import path from "node:path";

test.each(["harmony", "android", "ios"])("%s bundles can show the Passkey success message", (platform) => {
	const show = jest.fn();
	const snackbar = {show, LENGTH_LONG: 0};
	const module = platform === "harmony" ? {__esModule: true, default: snackbar} : {Snackbar: snackbar};
	const caller = {name: "metro", platform};
	const output = transformSync(`
		import {Snackbar as notice} from "react-native-snackbar";
		notice.show({text: "Passkey enabled", duration: notice.LENGTH_LONG});
	`, {
		filename: path.join(__dirname, "../src/components/settings/passkeySettings.tsx"),
		configFile: path.join(__dirname, "../babel.config.json"),
		babelrc: false,
		caller,
	});
	// Execute the bundled call against each platform's actual export shape.
	new Function("require", output!.code!)((name: string) => name === "react-native-snackbar" ? module : require(name));
	expect(show).toHaveBeenCalledWith({text: "Passkey enabled", duration: 0});
});
