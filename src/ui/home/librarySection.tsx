import {Text, TouchableOpacity, View} from "react-native";
import React, {useState} from "react";
import {getLibraryDays, getLibrarySectionList} from "../../network/library";
import {HomeNav, LibrarySectionRouteProp} from "./homeStack";
import {getStr} from "../../utils/i18n";
import {Calendar} from "../../utils/calendar";
import Snackbar from "react-native-snackbar";
import {simpleRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";

export const LibrarySectionScreen = ({
	route,
	navigation,
}: {
	route: LibrarySectionRouteProp;
	navigation: HomeNav;
}) => {
	const today = new Calendar().date;
	const dates = [today.toDate(), today.add(1, "day").toDate()];
	const [choice, setChoice] = useState<0 | 1>(0);

	const List = simpleRefreshListScreen(
		() => getLibrarySectionList(route.params, dates[choice]),
		(item) => (
			<TouchableOpacity
				style={{padding: 8}}
				disabled={!item.valid}
				onPress={() =>
					item.valid &&
					getLibraryDays(item)
						.then((r) =>
							navigation.navigate("LibrarySeat", {
								section: item,
								date: r[choice],
							}),
						)
						.catch(() =>
							Snackbar.show({
								text: getStr("networkRetry"),
								duration: Snackbar.LENGTH_SHORT,
							}),
						)
				}>
				<Text
					style={{
						textAlign: "center",
						textDecorationLine: item.valid ? "none" : "line-through",
						color: item.valid ? "black" : "grey",
					}}>{`${item.zhName} (${item.available}/${item.total})`}</Text>
			</TouchableOpacity>
		),
		(item) => String(item.id),
	);

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
			{<List />}
		</>
	);
};
