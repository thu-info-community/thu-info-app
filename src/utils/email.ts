import MailCore from "thu-info-mailcore";
import {currState, helper, store} from "../redux/store";
import {AppState, Platform} from "react-native";
import {configSet} from "../redux/actions/config";

const INBOX = "INBOX";

export const emailInit = async (emailName: string) => {
	if (Platform.OS === "ios") {
		return;
	}
	try {
		await MailCore.loginImap({
			hostname: "mails.tsinghua.edu.cn",
			port: 993, // port for smtp is 465
			username: `${emailName}@mails.tsinghua.edu.cn`,
			password: helper.password,
			authType: 0,
		});
		const {unseenCount} = await MailCore.statusFolder({folder: INBOX});
		store.dispatch(configSet("emailUnseen", unseenCount));
	} catch (e) {
		throw e;
	}
};

export const getMails = () =>
	MailCore.getMails({folder: INBOX, requestKind: 63})
		.then(({mails}) => mails.reverse())
		.catch((e) => {
			throw e;
		});

export const handleEmailInit = () => {
	const emailName = currState().config.emailName;
	if (emailName && emailName.length > 0) {
		console.log("Relaunch email init!");
		emailInit(currState().config.emailName);
	}
};

AppState.addEventListener("change", (e) => {
	if (e === "active") {
		handleEmailInit();
	}
});
