import {Alert, Text, TouchableOpacity, View} from "react-native";
import React from "react";
import {simpleRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";
import {getMails} from "../../utils/email";
import {RootNav} from "../../components/Root";

export const EmailListScreen = ({navigation}: {navigation: RootNav}) => {
	const List = simpleRefreshListScreen(
		getMails,
		(mail, _, __, {colors}) => (
			<View style={{flexDirection: "row", alignItems: "center"}}>
				<TouchableOpacity
					onPress={() => {
						console.log(mail.from);
						if (
							mail.from.includes("tsginhua") ||
							mail.from.includes("tsnighua") ||
							mail.from.includes("tsignhua") ||
							mail.from.includes("tsgnihua") ||
							mail.from.includes("tsngihua")
						) {
							Alert.alert(
								"钓鱼邮件警告",
								`该邮件的发件人为${mail.from}，该邮件被判定为钓鱼邮件，已为您智能拦截。`,
							);
						} else {
							navigation.navigate("Email", {messageId: mail.id});
						}
					}}>
					<Text
						style={{
							flex: 1,
							textAlign: "left",
							padding: 4,
							fontSize: 16,
							marginHorizontal: 10,
							color: mail.flags === 0 ? "red" : colors.text,
						}}>
						{mail.subject}
					</Text>
				</TouchableOpacity>
			</View>
		),
		(mail) => String(mail.id),
	);
	return <List />;
};
