import {Text} from "react-native";
import React, {useEffect, useState} from "react";
import MailCore from "thu-info-mailcore";
import WebView from "react-native-webview";
import {EmailRouteProp} from "./homeStack";

export const EmailScreen = ({route}: {route: EmailRouteProp}) => {
	const [mail, setMail] = useState<MailCore.MailDetail>();
	useEffect(() => {
		MailCore.getMail({
			folder: "INBOX",
			messageId: route.params.messageId,
			requestKind: 63,
		}).then(setMail);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	if (mail) {
		const adaptedHtml = `<head><meta name="viewport" content="width=100, initial-scale=1"></head><body>${mail.body}</body>`;
		return <WebView source={{html: adaptedHtml}} />;
	} else {
		return <Text>Loading...</Text>;
	}
};
