import {LibrarySeatRouteProp} from "./homeStack";
import {Alert, FlatList, Text, TouchableOpacity} from "react-native";
import React, {useEffect, useState} from "react";
import {bookLibrarySeat, getLibrarySeatList} from "../../network/library";
import {LibrarySeat} from "../../models/home/library";
import {getStr} from "../../utils/i18n";
import Snackbar from "react-native-snackbar";

export const LibrarySeatScreen = ({route}: {route: LibrarySeatRouteProp}) => {
	const {date, section} = route.params;
	const [seats, setSeats] = useState<LibrarySeat[]>([]);
	useEffect(() => {
		getLibrarySeatList(section, date).then(setSeats);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	return (
		<>
			<Text style={{fontSize: 16, textAlign: "center", padding: 9}}>
				{getStr("checkDate") + date.day}
			</Text>
			<FlatList
				data={seats}
				renderItem={({item}) => (
					<TouchableOpacity
						style={{padding: 8}}
						disabled={!item.valid}
						onPress={() =>
							item.valid &&
							Alert.alert(
								getStr("checkSeat"),
								item.zhName +
									"\n" +
									getStr(date.today ? "todayBookHint" : "tomorrowBookHint"),
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
											bookLibrarySeat(item, date)
												.then(({status, msg}) => {
													Snackbar.show({
														text:
															status === 1
																? getStr("bookSuccess")
																: getStr("bookFailureColon") + msg,
														duration: Snackbar.LENGTH_SHORT,
													});
													getLibrarySeatList(section, date).then(setSeats);
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
						<Text>
							{item.zhName + (item.valid ? "" : getStr("seatInvalid"))}
						</Text>
					</TouchableOpacity>
				)}
				keyExtractor={(item) => String(item.id)}
			/>
		</>
	);
};
