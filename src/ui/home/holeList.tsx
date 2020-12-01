import React, {useContext, useEffect, useState} from "react";
import {
	FlatList,
	Image,
	RefreshControl,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import {getHoleList, holeConfig, holeLogin} from "../../network/hole";
import {FetchMode, HoleTitleCard} from "../../models/home/hole";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import {NetworkRetry} from "../../components/easySnackbars";
import {ThemeContext} from "../../assets/themes/context";
import themes from "../../assets/themes/themes";
import Icon from "react-native-vector-icons/FontAwesome";
import TimeAgo from "react-native-timeago";
import {HoleMarkdown} from "../../components/home/hole";
import {HomeNav} from "./homeStack";
import {Material} from "../../constants/styles";

export const HoleListScreen = ({navigation}: {navigation: HomeNav}) => {
	const [data, setData] = useState<HoleTitleCard[]>([]);
	const [refreshing, setRefreshing] = useState(true);
	const [page, setPage] = useState(1);

	const themeName = useContext(ThemeContext);
	const theme = themes[themeName];

	const firstFetch = () => {
		setPage(1);
		setRefreshing(true);
		getHoleList(FetchMode.NORMAL, 1, "")
			.then((r) => setData(r))
			.catch((err) => {
				if (typeof err === "string") {
					holeLogin()
						.then(() =>
							Snackbar.show({text: err, duration: Snackbar.LENGTH_SHORT}),
						)
						.catch(() =>
							Snackbar.show({
								text: getStr("holePleaseSetToken"),
								duration: Snackbar.LENGTH_LONG,
							}),
						);
				} else {
					NetworkRetry();
				}
			})
			.then(() => setRefreshing(false));
	};

	useEffect(firstFetch, []);

	return (
		<FlatList
			data={data}
			renderItem={({item}) => {
				const needFold = holeConfig.foldTags.includes(item.tag);
				return (
					<TouchableOpacity
						style={Material.card}
						onPress={() => navigation.navigate("HoleDetail", item)}>
						<View
							style={{flexDirection: "row", justifyContent: "space-between"}}>
							<View style={{flexDirection: "row", alignItems: "center"}}>
								<Text
									style={{
										fontWeight: "bold",
										marginVertical: 2,
									}}>{`#${item.pid}`}</Text>
								{item.tag && item.tag !== "折叠" && (
									<View
										style={{
											backgroundColor: "#00c",
											borderRadius: 4,
											marginLeft: 5,
											paddingHorizontal: 4,
										}}>
										<Text style={{color: "white", fontWeight: "bold"}}>
											{item.tag}
										</Text>
									</View>
								)}
								<Text> </Text>
								<TimeAgo time={item.timestamp * 1000} />
							</View>
							<View style={{flexDirection: "row", alignItems: "center"}}>
								{needFold && <Text> 已隐藏</Text>}
								{!needFold && item.reply > 0 && (
									<View
										style={{
											flexDirection: "row",
											alignItems: "center",
										}}>
										<Text>{item.reply}</Text>
										<Icon name="comment" size={12} />
									</View>
								)}
								{!needFold && item.likenum > 0 && (
									<View
										style={{
											flexDirection: "row",
											alignItems: "center",
										}}>
										<Text>{item.likenum}</Text>
										<Icon name="star-o" size={12} />
									</View>
								)}
							</View>
						</View>
						{needFold || (
							<HoleMarkdown
								text={item.text}
								navigationHandler={(pid) =>
									navigation.navigate("HoleDetail", {pid, lazy: true})
								}
							/>
						)}
						{!needFold && item.type === "image" && (
							<Image
								source={{uri: holeConfig.imageBase + item.url}}
								style={{height: 400}}
								resizeMode="contain"
							/>
						)}
					</TouchableOpacity>
				);
			}}
			keyExtractor={(item) => `${item.pid}`}
			onEndReachedThreshold={0.5}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={firstFetch}
					colors={[theme.colors.accent]}
				/>
			}
			onEndReached={() => {
				setRefreshing(true);
				getHoleList(FetchMode.NORMAL, page + 1, "")
					.then((r) =>
						setData((o) =>
							o.concat(r.filter((it) => it.pid < o[o.length - 1].pid)),
						),
					)
					.catch(NetworkRetry)
					.then(() => setRefreshing(false));
				setPage((p) => p + 1);
			}}
		/>
	);
};
