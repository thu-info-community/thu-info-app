import React, {
	FC,
	PropsWithChildren,
	ReactElement,
	useEffect,
	useState,
} from "react";
import {Text, TouchableOpacity, View} from "react-native";
import {getStr} from "../../utils/i18n";
import {RootNav, RootStackParamList} from "../Root";
import {RouteProp} from "@react-navigation/native";
import IconRight from "../../assets/icons/IconRight";
import {helper} from "../../redux/store";
import Snackbar from "react-native-snackbar";
import {LibraryBase} from "thu-info-lib/dist/models/home/library";
import {useColorScheme} from "react-native";
import themes, {Theme} from "../../assets/themes/themes";
import {RoundedListView} from "../views";
import IconSocket from "../../assets/icons/IconSocket";
import IconDisable from "../../assets/icons/IconDisable";

export function libraryRefreshListScreen<
	T extends LibraryBase,
	S extends "LibraryFloor" | "LibrarySection" | "LibrarySeat",
>(
	dataSource: (
		props: PropsWithChildren<{
			navigation: RootNav;
			route: RouteProp<RootStackParamList, S>;
		}>,
		dateChoice: 0 | 1,
	) => Promise<T[]>,
	onPress: (
		props: PropsWithChildren<{
			navigation: RootNav;
			route: RouteProp<RootStackParamList, S>;
		}>,
		item: T,
		choice: 0 | 1,
		refresh: () => void,
	) => () => void,
	header?: (theme: Theme) => ReactElement,
	clickable?: boolean,
): FC<{
	navigation: RootNav;
	route: RouteProp<RootStackParamList, S>;
}> {
	return (
		props: PropsWithChildren<{
			navigation: RootNav;
			route: RouteProp<RootStackParamList, S>;
		}>,
	) => {
		const [choice, setChoice] = useState<0 | 1>(
			props?.route?.params?.dateChoice ?? 0,
		);
		const [data, setData] = useState<T[]>([]);
		const [refreshing, setRefreshing] = useState(false);
		const themeName = useColorScheme();
		const theme = themes(themeName);

		const refresh = () => {
			setRefreshing(true);
			dataSource(props, choice)
				.then(setData)
				.catch(() =>
					Snackbar.show({
						text: getStr("networkRetry"),
						duration: Snackbar.LENGTH_SHORT,
					}),
				)
				.then(() => setRefreshing(false));
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
		useEffect(refresh, [choice]);

		return (
			<View style={{margin: 12, flex: 1}}>
				<View style={{flexDirection: "row", marginLeft: 8}}>
					<TouchableOpacity style={{padding: 6}} onPress={() => setChoice(0)}>
						<Text
							style={{
								color:
									choice === 0 ? theme.colors.primaryLight : theme.colors.text,
								textAlign: "center",
								fontSize: 16,
							}}>
							{getStr("today")}
						</Text>
					</TouchableOpacity>
					<TouchableOpacity style={{padding: 6}} onPress={() => setChoice(1)}>
						<Text
							style={{
								color:
									choice === 1 ? theme.colors.primaryLight : theme.colors.text,
								textAlign: "center",
								fontSize: 16,
							}}>
							{getStr("tomorrow")}
						</Text>
					</TouchableOpacity>
				</View>
				<RoundedListView
					style={{marginTop: 12}}
					data={data}
					renderItem={(item, colors, index) => {
						const moreInformation = // @ts-ignore
							item.available !== undefined && item.total !== undefined // @ts-ignore
								? ` (${item.available}/${item.total})`
								: "";
						return (
							<TouchableOpacity
								style={{
									flexDirection: "row",
									alignItems: "center",
									marginTop: index === 0 ? 0 : 12,
									marginBottom: index === data.length - 1 ? 0 : 12,
								}}
								disabled={!item.valid || clickable === false}
								onPress={() =>
									item.valid && onPress(props, item, choice, refresh)()
								}>
								{"status" in item &&
									// @ts-ignore
									(item.status === "available" ? (
										<IconSocket size={24} color={colors.primaryLight} />
									) : // @ts-ignore
									item.status === "unavailable" ? (
										<IconSocket size={24} color={colors.fontB2} />
									) : (
										<IconDisable size={24} />
									))}
								<Text
									style={{
										color: item.valid ? colors.text : colors.fontB2,
										fontSize: 16,
										flex: 0,
										marginLeft: 8,
									}}>
									{item.zhName + moreInformation}
								</Text>
								<View style={{flex: 1}} />
								{(!helper.mocked() || header) && !("status" in item) && (
									<IconRight height={16} width={16} />
								)}
								{"status" in item && (
									<Text
										style={{
											color: item.valid ? colors.primaryLight : colors.fontB2,
											fontSize: 16,
											flex: 0,
										}}>
										{getStr(item.valid ? "clickToBook" : "seatInvalid")}
									</Text>
								)}
							</TouchableOpacity>
						);
					}}
					keyExtractor={(item) => String(item.id)}
					refreshing={refreshing}
					onRefresh={refresh}
				/>
			</View>
		);
	};
}
