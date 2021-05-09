import MailCore from "thu-info-mailcore";
import {helper} from "../redux/store";
import {Platform} from "react-native";

export const emailInit = async () => {
	if (Platform.OS === "ios") {
		return;
	}
	const INBOX = "INBOX";
	await MailCore.loginImap({
		hostname: "mails.tsinghua.edu.cn",
		port: 993, // port for smtp is 465
		username: `${helper.emailName}@mails.tsinghua.edu.cn`,
		password: helper.password,
		authType: 0,
	});
	const {unseenCount} = await MailCore.statusFolder({folder: INBOX});
	console.log(unseenCount);
};
