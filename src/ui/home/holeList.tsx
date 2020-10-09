import React, {useContext, useEffect, useState} from "react";
import {
	FlatList,
	Image,
	RefreshControl,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import {getHoleList, holeLogin} from "../../network/hole";
import {FetchMode, HoleTitleCard} from "../../models/home/hole";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import {NetworkRetry} from "../../components/easySnackbars";
import {ThemeContext} from "../../assets/themes/context";
import themes from "../../assets/themes/themes";
import Icon from "react-native-vector-icons/FontAwesome";
import TimeAgo from "react-native-timeago";
import {HoleMarkdown} from "../../components/home/hole";
import {IMAGE_BASE} from "../../constants/strings";
import {HomeNav} from "./homeStack";
import {Material} from "../../constants/styles";

const FOLD_TAGS = [
	"性相关",
	"政治相关",
	"性话题",
	"政治话题",
	"折叠",
	"NSFW",
	"刷屏",
	"真实性可疑",
	"用户举报较多",
	"举报较多",
	"重复内容",
];

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
				const needFold = FOLD_TAGS.indexOf(item.tag) !== -1;
				return (
					<TouchableOpacity
						style={Material.card}
						onPress={() => navigation.navigate("HoleDetail", item)}>
						<View
							style={{flexDirection: "row", justifyContent: "space-between"}}>
							<View style={{flexDirection: "row"}}>
								<Text>{`#${item.pid}`}</Text>
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
							<View style={{flexDirection: "row"}}>
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
						{needFold || <HoleMarkdown text={item.text} />}
						{!needFold && item.type === "image" && (
							<Image
								source={{uri: IMAGE_BASE + item.url}}
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
