import {Alert, Text} from "react-native";
import React, {useEffect, useState} from "react";
import MailCore from "thu-info-mailcore";
import WebView from "react-native-webview";
import {helper} from "../../redux/store";

const demo = async () => {
	console.log(`Login with ${helper.emailName}@mails.tsinghua.edu.cn`);
	await Promise.all([
		MailCore.loginImap({
			hostname: "mails.tsinghua.edu.cn",
			port: 993,
			username: `${helper.emailName}@mails.tsinghua.edu.cn`,
			password: helper.password,
			authType: 0,
		}),
		MailCore.loginSmtp({
			hostname: "mails.tsinghua.edu.cn",
			port: 465,
			username: `${helper.emailName}@mails.tsinghua.edu.cn`,
			password: helper.password,
			authType: 0,
		}),
	]);
	console.log("Login ok");
	const {path} = (await MailCore.getFolders()).folders[0];
	console.log("Get folders ok");
	const {messageCount} = await MailCore.statusFolder({folder: path});
	console.log("Get folder status ok");
	const {mails} = await MailCore.getMailsByRange({
		folder: path,
		requestKind: 63,
		from: messageCount - 9,
		length: 10,
	});
	console.log("Get mails ok");
	console.log("Fetched: " + mails.length + " mails");
	for (const mail of mails) {
		console.log(mail.subject);
	}
	const {id} = mails[9];
	return await MailCore.getMail({
		folder: path,
		messageId: id,
		requestKind: 63,
	});
};

export const EmailScreen = () => {
	const [mail, setMail] = useState<MailCore.MailDetail>();
	useEffect(() => {
		demo()
			.then(setMail)
			.then(() => {
				Alert.alert(
					"Confirm",
					"Now you are going to send a message to yourself.",
					[
						{
							text: "Cancel",
							onPress: () => {},
						},
						{
							text: "OK",
							onPress: () => {
								const toObj = {} as any;
								toObj[`${helper.emailName}@mails.tsinghua.edu.cn`] = "Myself";
								MailCore.sendMail({
									from: {
										addressWithDisplayName: "THUInfo",
										mailbox: `${helper.emailName}@mails.tsinghua.edu.cn`,
									},
									to: toObj,
									body: "Demo message.",
								}).catch(console.error);
							},
						},
					],
				);
			})
			.catch(console.error);
	}, []);
	if (mail) {
		const adaptedHtml = `<head><meta name="viewport" content="width=100, initial-scale=1"></head><body>${mail.body}</body>`;
		return <WebView source={{html: adaptedHtml}} />;
	} else {
		return <Text>Loading...</Text>;
	}
};
