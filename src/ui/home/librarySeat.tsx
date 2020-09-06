import {LibrarySeatRouteProp} from "./homeStack";
import {Alert, Text, TouchableOpacity} from "react-native";
import React from "react";
import {bookLibrarySeat, getLibrarySeatList} from "../../network/library";
import {getStr} from "../../utils/i18n";
import Snackbar from "react-native-snackbar";
import {simpleRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";

export const LibrarySeatScreen = simpleRefreshListScreen(
	({route}: {route: LibrarySeatRouteProp}) =>
		getLibrarySeatList(route.params.section, route.params.date),
	(item, refresh, {route}: {route: LibrarySeatRouteProp}) => (
		<TouchableOpacity
			style={{padding: 8}}
			disabled={!item.valid}
			onPress={() =>
				item.valid &&
				Alert.alert(
					getStr("checkSeat"),
					item.zhName +
						"\n" +
						getStr(
							route.params.date.today ? "todayBookHint" : "tomorrowBookHint",
						),
					[
						{
							text: getStr("cancel"),
							style: "cancel",
						},
						{
							text: getStr("confirm"),
							onPress: () => {
								Snackbar.show({
									text: getStr("processing"),
									duration: Snackbar.LENGTH_SHORT,
								});
								bookLibrarySeat(item, route.params.date)
									.then(({status, msg}) => {
										Snackbar.show({
											text:
												status === 1
													? getStr("bookSuccess")
													: getStr("bookFailureColon") + msg,
											duration: Snackbar.LENGTH_SHORT,
										});
										refresh();
									})
									.catch(() =>
										Snackbar.show({
											text: getStr("networkRetry"),
											duration: Snackbar.LENGTH_SHORT,
										}),
									);
							},
						},
					],
					{cancelable: true},
				)
			}>
			<Text>{item.zhName + (item.valid ? "" : getStr("seatInvalid"))}</Text>
		</TouchableOpacity>
	),
	(item) => String(item.id),
);
