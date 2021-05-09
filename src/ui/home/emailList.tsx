import {Text, TouchableOpacity, View} from "react-native";
import React from "react";
import {simpleRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";
import {getMails} from "../../utils/email";
import {HomeNav} from "./homeStack";

export const EmailListScreen = ({navigation}: {navigation: HomeNav}) => {
	const List = simpleRefreshListScreen(
		getMails,
		(mail, _, __, {colors}) => (
			<View style={{flexDirection: "row", alignItems: "center"}}>
				<TouchableOpacity
					onPress={() => navigation.navigate("Email", {messageId: mail.id})}>
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
