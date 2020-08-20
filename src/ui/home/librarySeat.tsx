import {LibrarySeatRouteProp} from "./homeStack";
import {Alert, FlatList, Text, TouchableOpacity} from "react-native";
import React, {useEffect, useState} from "react";
import {getLibrarySeatList} from "../../network/library";
import {LibrarySeat} from "../../models/home/library";
import {getStr} from "../../utils/i18n";

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
								item.zhName,
								[
									{
										text: getStr("cancel"),
										style: "cancel",
									},
									{
										text: getStr("confirm"),
									},
								],
								{cancelable: true},
							)
						}>
						<Text>{item.zhName}</Text>
					</TouchableOpacity>
				)}
				keyExtractor={(item) => String(item.id)}
			/>
		</>
	);
};
