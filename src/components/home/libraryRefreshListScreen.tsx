import React, {FC, PropsWithChildren, ReactElement, useState} from "react";
import {simpleRefreshListScreen} from "../settings/simpleRefreshListScreen";
import {Text, TouchableOpacity, View} from "react-native";
import {getStr} from "../../utils/i18n";
import {LibraryBase} from "../../models/home/library";
import {HomeNav, HomeStackParamList} from "../../ui/home/homeStack";
import {RouteProp} from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome";
import {mocked} from "../../redux/store";

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
	header?: ReactElement,
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
					<View>
						<TouchableOpacity
							style={{
								backgroundColor: "#ffffff",
								flexDirection: "row",
								justifyContent: "space-between",
								alignItems: "center",
								paddingHorizontal: 12,
							}}
							disabled={!item.valid}
							onPress={() =>
								item.valid && onPress(props, item, choice, refresh)()
							}>
							<Text
								style={{
									textAlign: "center",
									textDecorationLine: item.valid ? "none" : "line-through",
									color: item.valid ? "black" : "grey",
									marginVertical: 14,
								}}>
								{item.zhName + moreInformation}
							</Text>
							{(!mocked() || header) && (
								<Icon name="angle-right" size={24} color="grey" />
							)}
						</TouchableOpacity>
						<View style={{backgroundColor: "lightgray", height: 1}} />
					</View>
				);
			},
			(item) => String(item.id),
			undefined,
			header || <View style={{backgroundColor: "lightgray", height: 1}} />,
		);

		return (
			<>
				<View style={{flexDirection: "row", margin: 15}}>
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
