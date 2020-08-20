import {FlatList, Text, TouchableOpacity, View} from "react-native";
import React, {useEffect, useState} from "react";
import {LibrarySection} from "../../models/home/library";
import {
	getLibraryDays,
	getLibrarySeatList,
	getLibrarySectionList,
} from "../../network/library";
import {LibrarySectionRouteProp} from "./homeStack";
import {getStr} from "../../utils/i18n";
import {Calendar} from "../../utils/calendar";

export const LibrarySectionScreen = ({
	route,
}: {
	route: LibrarySectionRouteProp;
}) => {
	const today = new Calendar().date;
	const dates = [today.toDate(), today.add(1, "day").toDate()];
	const [choice, setChoice] = useState<0 | 1>(0);
	const [sections, setSections] = useState<LibrarySection[]>([]);
	/* useEffect(() => {
		getLibraryDays(route.params).then(setDays);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); */
	useEffect(() => {
		getLibrarySectionList(route.params, dates[choice]).then(setSections);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [choice]);
	return (
		<>
			<View style={{flexDirection: "row"}}>
				<TouchableOpacity
					style={{padding: 6, flex: 1}}
					onPress={() => setChoice(0)}>
					<Text
						style={{
							color: choice === 0 ? "blue" : "black",
							textAlign: "center",
						}}>
						{getStr("today")}
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={{padding: 6, flex: 1}}
					onPress={() => setChoice(1)}>
					<Text
						style={{
							color: choice === 1 ? "blue" : "black",
							textAlign: "center",
						}}>
						{getStr("tomorrow")}
					</Text>
				</TouchableOpacity>
			</View>
			<FlatList
				data={sections}
				renderItem={({item}) => (
					<TouchableOpacity
						style={{padding: 8}}
						disabled={!item.valid}
						onPress={() =>
							item.valid &&
							getLibraryDays(item).then((r) =>
								getLibrarySeatList(item, r[choice]).then(console.log),
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
