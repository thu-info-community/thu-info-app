import React, {FC, PropsWithChildren, useState} from "react";
import {simpleRefreshListScreen} from "../settings/simpleRefreshListScreen";
import {Text, TouchableOpacity, View} from "react-native";
import {getStr} from "../../utils/i18n";
import {LibraryBase} from "../../models/home/library";
import {HomeNav, HomeStackParamList} from "../../ui/home/homeStack";
import {RouteProp} from "@react-navigation/native";

export function libraryRefreshListScreen<
	T extends LibraryBase,
	S extends "LibraryFloor" | "LibrarySection" | "LibrarySeat"
>(
	dataSource: (
		props: PropsWithChildren<{
			navigation: HomeNav;
			route: RouteProp<HomeStackParamList, S>;
		}>,
		dateChoice: 0 | 1,
	) => Promise<T[]>,
	onPress: (
		props: PropsWithChildren<{
			navigation: HomeNav;
			route: RouteProp<HomeStackParamList, S>;
		}>,
		item: T,
		choice: 0 | 1,
		refresh: () => void,
	) => () => void,
): FC<{
	navigation: HomeNav;
	route: RouteProp<HomeStackParamList, S>;
}> {
	return (
		props: PropsWithChildren<{
			navigation: HomeNav;
			route: RouteProp<HomeStackParamList, S>;
		}>,
	) => {
		const [choice, setChoice] = useState<0 | 1>(
			props?.route?.params?.dateChoice ?? 0,
		);

		const List = simpleRefreshListScreen(
			() => dataSource(props, choice),
			(item, refresh) => {
				const moreInformation = // @ts-ignore
					item.available !== undefined && item.total !== undefined // @ts-ignore
						? ` (${item.available}/${item.total})`
						: item.valid
						? ""
						: getStr("seatInvalid");
				return (
					<TouchableOpacity
						style={{padding: 8}}
						disabled={!item.valid}
						onPress={() =>
							item.valid && onPress(props, item, choice, refresh)()
						}>
						<Text
							style={{
								textAlign: "center",
								textDecorationLine: item.valid ? "none" : "line-through",
								color: item.valid ? "black" : "grey",
							}}>
							{item.zhName + moreInformation}
						</Text>
					</TouchableOpacity>
				);
			},
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
}
