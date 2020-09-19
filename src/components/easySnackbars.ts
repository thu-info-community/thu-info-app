import Snackbar from "react-native-snackbar";
import {getStr} from "../utils/i18n";

export const NetworkRetry = () =>
	Snackbar.show({
		text: getStr("networkRetry"),
		duration: Snackbar.LENGTH_SHORT,
	});
