import MailCore from "thu-info-mailcore";
import {helper, store} from "../redux/store";
import {Platform} from "react-native";
import {configSet} from "../redux/actions/config";
import AV from "leancloud-storage/core";

const INBOX = "INBOX";

export const emailInit = async () => {
	if (Platform.OS === "ios") {
		return;
	}
	try {
		await MailCore.loginImap({
			hostname: "mails.tsinghua.edu.cn",
			port: 993, // port for smtp is 465
			username: `${helper.emailName}@mails.tsinghua.edu.cn`,
			password: helper.password,
			authType: 0,
		});
		const {unseenCount} = await MailCore.statusFolder({folder: INBOX});
		store.dispatch(configSet("emailUnseen", unseenCount));
	} catch (e) {
		const feedback = new (AV.Object.extend("EmailFeedback"))();
		feedback.set("e", String(e));
		feedback.save().then(console.log);
		throw e;
	}
};

export const getMails = () =>
	MailCore.getMails({folder: INBOX, requestKind: 63})
		.then(({mails}) => mails.reverse())
		.catch((e) => {
			const feedback = new (AV.Object.extend("EmailFeedback"))();
			feedback.set("e", String(e));
			feedback.save().then(console.log);
			throw e;
		});
