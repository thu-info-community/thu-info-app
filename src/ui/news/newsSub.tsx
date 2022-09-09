import {
	ScrollView,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import {NetworkRetry} from "../../components/easySnackbars";
import {helper} from "../../redux/store";
import React, {useEffect, useState} from "react";
import {ChannelTag, NewsSubscription} from "thu-info-lib/dist/models/news/news";
import {RootNav} from "../../components/Root";
import {RoundedView} from "../../components/views";
import IconRight from "../../assets/icons/IconRight";
import IconCheck from "../../assets/icons/IconCheck";
import {styles} from "../settings/settings";

const NewsSubItem = ({
	newsSub,
	setSubList,
}: {
	newsSub: NewsSubscription;
	setSubList: any;
}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	const makeStr = () => {
		if (newsSub.source && newsSub.channel) {
			return `${newsSub.title}: ${newsSub.source} | ${newsSub.channel}`;
		}
		if (newsSub.source) {
			return `${newsSub.title}: ${newsSub.source}`;
		}
		if (newsSub.channel) {
			return `${newsSub.title}: ${newsSub.channel}`;
		}
	};
	return (
		<View
			style={{
				backgroundColor: theme.colors.contentBackground,
				justifyContent: "center",
				paddingVertical: 12,
				paddingHorizontal: 16,
				marginVertical: 4,
				borderRadius: 8,
			}}>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
				}}>
				<Text
					style={{
						color: theme.colors.fontB1,
						fontSize: 16,
					}}>
					{makeStr()}
				</Text>
				<View style={{flex: 1}} />
				<TouchableOpacity
					onPress={() => {
						helper
							.removeNewsSubscription(newsSub.id)
							.then((res) => {
								if (res) {
									// @ts-ignore
									setSubList((i) => i.filter((j) => j !== newsSub));
								} else {
									return;
								}
							})
							.catch(NetworkRetry);
					}}>
					<Text
						style={{
							color: theme.colors.statusWarning,
							fontSize: 16,
						}}>
						{getStr("delete")}
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

export const NewsSubScreen = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	const [subList, setSubList] = useState<NewsSubscription[]>([]);
	const emptySource = {sourceId: "", sourceName: getStr("notSelected")};
	const [sourceSelected, setSourceSelected] = useState(emptySource);
	const emptyChannel = {id: "", title: getStr("notSelected")};
	const [channelSelected, setChannelSelected] = useState(emptyChannel);

	const fetchSubscriptionList = () => {
		helper
			.getNewsSubscriptionList()
			.then((res) => {
				setSubList(res);
				console.log(res);
			})
			.catch(NetworkRetry);
	};

	useEffect(fetchSubscriptionList, []);

	return (
		<ScrollView style={{backgroundColor: theme.colors.themeBackground}}>
			<View
				style={{
					marginHorizontal: 12,
				}}>
				<Text
					style={{
						textAlign: "left",
						fontSize: 15,
						marginTop: 18,
						marginLeft: 12,
						marginBottom: 8,
						fontWeight: "bold",
						color: theme.colors.text,
					}}>
					{getStr("mySub")}
				</Text>
				{subList.map((s) => (
					<NewsSubItem newsSub={s} key={s.id} setSubList={setSubList} />
				))}
				<Text
					style={{
						textAlign: "left",
						fontSize: 15,
						marginTop: 18,
						marginLeft: 12,
						marginBottom: 8,
						fontWeight: "bold",
						color: theme.colors.text,
					}}>
					{getStr("createSub")}
				</Text>
				<RoundedView style={{marginTop: 16, padding: 16}}>
					<TouchableOpacity
						onPress={() => {
							// @ts-ignore
							navigation.navigate("NewsSubSourceSelect", {
								sourceSelected,
								setSourceSelected,
							});
						}}>
						<View style={{flexDirection: "row", alignItems: "center"}}>
							<Text style={{color: theme.colors.fontB1, fontSize: 16, flex: 0}}>
								{getStr("newsSource")}
							</Text>
							<View style={{flex: 1}} />
							<Text
								style={{color: theme.colors.fontB3, fontSize: 16, flex: 0}}
								numberOfLines={1}>
								{sourceSelected.sourceName}
							</Text>
							<IconRight height={24} width={24} />
						</View>
					</TouchableOpacity>
					<View
						style={{
							height: 1,
							backgroundColor: theme.colors.themeGrey,
							marginVertical: 12,
						}}
					/>
					<TouchableOpacity
						onPress={() => {
							// @ts-ignore
							navigation.navigate("NewsSubChannelSelect", {
								channelSelected,
								setChannelSelected,
							});
						}}>
						<View style={{flexDirection: "row", alignItems: "center"}}>
							<Text style={{color: theme.colors.fontB1, fontSize: 16, flex: 0}}>
								{getStr("newsChannel")}
							</Text>
							<View style={{flex: 1}} />
							<Text
								style={{color: theme.colors.fontB3, fontSize: 16, flex: 0}}
								numberOfLines={1}>
								{channelSelected.title}
							</Text>
							<IconRight height={24} width={24} />
						</View>
					</TouchableOpacity>
				</RoundedView>
				<Text
					style={{
						justifyContent: "center",
						paddingVertical: 12,
						paddingHorizontal: 16,
						marginVertical: 4,
						fontSize: 16,
						color: theme.colors.fontB3,
					}}>
					{getStr("newsSubTip")}
				</Text>
				<View style={{flexDirection: "row", justifyContent: "flex-end"}}>
					<TouchableOpacity
						style={{
							backgroundColor:
								sourceSelected.sourceId === "" &&
								channelSelected.id === undefined
									? theme.colors.themeGrey
									: theme.colors.primaryLight,
							alignItems: "center",
							justifyContent: "center",
							paddingVertical: 8,
							paddingHorizontal: 24,
							borderRadius: 4,
							marginRight: 12,
						}}
						disabled={
							sourceSelected.sourceId === "" && channelSelected.id === undefined
						}
						onPress={() => {
							helper
								.addNewsSubscription(
									channelSelected.id,
									sourceSelected.sourceId,
								)
								.then((res) => {
									if (res) {
										setSourceSelected(emptySource);
										setChannelSelected(emptyChannel);
										fetchSubscriptionList();
									} else {
										return;
									}
								})
								.catch(NetworkRetry);
						}}>
						<Text
							style={{
								color: theme.colors.contentBackground,
								fontSize: 16,
							}}>
							{getStr("add")}
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</ScrollView>
	);
};

export const NewsSubSourceSelectScreen = ({
	navigation,
	route,
}: {
	navigation: RootNav;
	route: any;
}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	const [sourceList, setSourceList] = useState<
		{sourceId: string; sourceName: string}[]
	>([
		{
			sourceId: "",
			sourceName: getStr("loading"),
		},
	]);
	useEffect(() => {
		helper
			.getNewsSourceList()
			.then((res) => {
				setSourceList(
					[{sourceId: "", sourceName: getStr("notSelected")}].concat(res),
				);
			})
			.catch(NetworkRetry);
	}, []);

	return (
		<ScrollView style={{flex: 1, padding: 12}}>
			<RoundedView style={{...style.rounded, marginBottom: 32}}>
				{sourceList.map((s, index) => (
					<View key={s.sourceId}>
						{index > 0 && <View style={style.separator} />}
						<TouchableOpacity
							style={style.touchable}
							onPress={() => {
								route.params.setSourceSelected(s);
								navigation.pop();
							}}>
							<Text style={style.text}>{s.sourceName}</Text>
							{s.sourceName !== getStr("loading") &&
								s.sourceId === route.params.sourceSelected.sourceId && (
									<IconCheck width={18} height={18} />
								)}
						</TouchableOpacity>
					</View>
				))}
			</RoundedView>
		</ScrollView>
	);
};

export const NewsSubChannelSelectScreen = ({
	navigation,
	route,
}: {
	navigation: RootNav;
	route: any;
}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	const [channelList, setChannelList] = useState<
		{id: ChannelTag | undefined; title: string}[]
	>([]);
	useEffect(() => {
		helper
			.getNewsChannelList(getStr("mark") === "CH" ? false : true)
			.then((res) => {
				setChannelList(
					[
						{
							id: undefined,
							title: getStr("notSelected"),
						} as {id: ChannelTag | undefined; title: string},
					].concat(res),
				);
			})
			.catch(NetworkRetry);
	}, []);

	return (
		<ScrollView style={{flex: 1, padding: 12}}>
			<RoundedView style={{...style.rounded, marginBottom: 32}}>
				{channelList.map((c, index) => (
					<View key={c.id}>
						{index > 0 && <View style={style.separator} />}
						<TouchableOpacity
							style={style.touchable}
							onPress={() => {
								route.params.setChannelSelected(c);
								navigation.pop();
							}}>
							<Text style={style.text}>{c.title}</Text>
							{c.title !== getStr("loading") &&
								c.id === route.params.channelSelected.id && (
									<IconCheck width={18} height={18} />
								)}
						</TouchableOpacity>
					</View>
				))}
			</RoundedView>
		</ScrollView>
	);
};
