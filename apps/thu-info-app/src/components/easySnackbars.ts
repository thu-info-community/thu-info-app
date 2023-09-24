import Snackbar from "react-native-snackbar";
import {getStr} from "../utils/i18n";

export const NetworkRetry = (e?: any) =>
	Snackbar.show({
		text: getStr("networkRetry") + (e?.message ?? ""),
		duration: Snackbar.LENGTH_SHORT,
	});
