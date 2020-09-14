import React, {FC, PropsWithChildren, useState} from "react";
import {simpleRefreshListScreen} from "../settings/simpleRefreshListScreen";
import {Text, TouchableOpacity, View} from "react-native";
import {getStr} from "../../utils/i18n";
import {LibraryBase} from "../../models/home/library";
import {HomeNav} from "../../ui/home/homeStack";

export function libraryRefreshListScreen<T extends LibraryBase>(
	dataSource: (
		props: PropsWithChildren<any>,
		dateChoice: 0 | 1,
	) => Promise<T[]>,
	onPress: (
		props: PropsWithChildren<any>,
		item: T,
		choice: 0 | 1,
		refresh: () => void,
	) => () => void,
): FC {
	return (props: PropsWithChildren<any> & {navigation: HomeNav}) => {
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
