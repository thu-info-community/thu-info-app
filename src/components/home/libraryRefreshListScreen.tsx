import React, {FC, PropsWithChildren, ReactElement, useState} from "react";
import {simpleRefreshListScreen} from "../settings/simpleRefreshListScreen";
import {Alert, Text, TouchableOpacity, View} from "react-native";
import {getStr} from "../../utils/i18n";
import {RootNav, RootStackParamList} from "../Root";
import {RouteProp} from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome";
import {helper} from "../../redux/store";
import Snackbar from "react-native-snackbar";
import {LibraryBase} from "thu-info-lib/dist/models/home/library";
import {useColorScheme} from "react-native";
import themes, {Theme} from "../../assets/themes/themes";
import {toggleSocketState} from "../../utils/webApi";

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
		const themeName = useColorScheme();
		const theme = themes(themeName);

		const List = simpleRefreshListScreen(
			() => dataSource(props, choice),
			(item, refresh, _, {colors}) => {
				const moreInformation = // @ts-ignore
					item.available !== undefined && item.total !== undefined // @ts-ignore
						? ` (${item.available}/${item.total})`
						: item.valid
						? ""
						: getStr("seatInvalid");
				return (
					<View>
						<View style={{flexDirection: "row"}}>
							{"status" in item && (
								<TouchableOpacity
									style={{
										backgroundColor: colors.background,
										flexDirection: "row",
										justifyContent: "center",
										alignItems: "center",
										paddingHorizontal: 12,
										flex: 1,
									}}
									onPress={() =>
										Snackbar.show({
											text: getStr("socketReportShort"),
											duration: Snackbar.LENGTH_SHORT,
										})
									}
									onLongPress={() => {
										// @ts-ignore
										if (item.status === "unknown") {
											Alert.alert(
												getStr("socketReportPrompt"),
												getStr("confirmReportUnknownSocket"),
												[
													{text: getStr("cancel")},
													{
														text: getStr("socketUnavailable"),
														onPress: () => {
															toggleSocketState(
																item.id, // @ts-ignore
																"unavailable", // @ts-ignore
															)
																.then(() =>
																	Snackbar.show({
																		text: getStr("reportSuccessful"),
																		duration: Snackbar.LENGTH_SHORT,
																	}),
																)
																.catch(() =>
																	Snackbar.show({
																		text: getStr("reportFail"),
																		duration: Snackbar.LENGTH_SHORT,
																	}),
																);
														},
													},
													{
														text: getStr("socketAvailable"),
														onPress: () => {
															toggleSocketState(
																item.id, // @ts-ignore
																"available", // @ts-ignore
															)
																.then(() =>
																	Snackbar.show({
																		text: getStr("reportSuccessful"),
																		duration: Snackbar.LENGTH_SHORT,
																	}),
																)
																.catch(() =>
																	Snackbar.show({
																		text: getStr("reportFail"),
																		duration: Snackbar.LENGTH_SHORT,
																	}),
																);
														},
													},
												],
												{cancelable: true},
											);
										} else {
											Alert.alert(
												getStr(
													// @ts-ignore
													item.status === "available"
														? "confirmReportNoSocket"
														: "confirmReportHasSocket",
												),
												getStr("socketReportPrompt"),
												[
													{text: getStr("cancel")},
													{
														text: getStr("confirm"),
														onPress: () => {
															toggleSocketState(
																item.id, // @ts-ignore
																item.status === "available"
																	? "unavailable"
																	: "available", // @ts-ignore
															)
																.then(() =>
																	Snackbar.show({
																		text: getStr("reportSuccessful"),
																		duration: Snackbar.LENGTH_SHORT,
																	}),
																)
																.catch(() =>
																	Snackbar.show({
																		text: getStr("reportFail"),
																		duration: Snackbar.LENGTH_SHORT,
																	}),
																);
														},
													},
												],
												{cancelable: true},
											);
										}
									}}>
									<Text
										style={{
											textAlign: "center",
											color:
												// @ts-ignore
												item.status === "available"
													? "green"
													: // @ts-ignore
													item.status === "unavailable"
													? "blue"
													: "black",
										}}>
										{
											// @ts-ignore
											//getStr(item.hasSocket ? "hasSocket" : "noSocket")
											getStr(
												// @ts-ignore
												item.status === "available"
													? "socketAvailable"
													: // @ts-ignore
													item.status === "unavailable"
													? "socketUnavailable"
													: "socketUnknown",
											)
										}
									</Text>
								</TouchableOpacity>
							)}
							<TouchableOpacity
								style={{
									backgroundColor: colors.background,
									flexDirection: "row",
									justifyContent: "space-between",
									alignItems: "center",
									paddingHorizontal: 12,
									flex: 2,
								}}
								disabled={!item.valid || clickable === false}
								onPress={() =>
									item.valid && onPress(props, item, choice, refresh)()
								}>
								<Text
									style={{
										textAlign: "center",
										textDecorationLine: item.valid ? "none" : "line-through",
										color: item.valid ? colors.text : "grey",
										marginVertical: 14,
									}}>
									{item.zhName + moreInformation}
								</Text>
								{(!helper.mocked() || header) && (
									<Icon name="angle-right" size={24} color="grey" />
								)}
							</TouchableOpacity>
						</View>
						<View style={{backgroundColor: "lightgray", height: 1}} />
					</View>
				);
			},
			(item) => String(item.id),
			undefined,
			header ??
				(() => <View style={{backgroundColor: "lightgray", height: 1}} />),
		);

		return (
			<>
				<View style={{flexDirection: "row", margin: 15}}>
					<TouchableOpacity
						style={{padding: 6, flex: 1}}
						onPress={() => setChoice(0)}>
						<Text
							style={{
								color: choice === 0 ? "blue" : theme.colors.text,
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
								color: choice === 1 ? "blue" : theme.colors.text,
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
