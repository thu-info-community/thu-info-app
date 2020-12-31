import {
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	Keyboard,
	View,
	Dimensions,
	Pressable,
} from "react-native";
import React, {useEffect, useState} from "react";
import {HoleDetailRouteProp, HomeNav} from "./homeStack";
import {getStr} from "../../utils/i18n";
import {Material} from "../../constants/styles";
import {HoleMarkdown} from "../../components/home/hole";
import TimeAgo from "react-native-timeago";
import Icon from "react-native-vector-icons/FontAwesome";
import {HoleCommentCard, HoleTitleCard} from "../../models/home/hole";
import {getHoleDetail, holeConfig, postHoleComment} from "../../network/hole";
import {NetworkRetry} from "../../components/easySnackbars";
import Snackbar from "react-native-snackbar";
import {useHeaderHeight} from "@react-navigation/stack";

const dummyHoleTitleCard = {
	pid: -1,
	text: "",
	type: "",
	url: "",
	timestamp: -1,
	reply: 0,
	likenum: 0,
	tag: "",
};

export const HoleDetailScreen = ({
	route,
	navigation,
}: {
	route: HoleDetailRouteProp;
	navigation: HomeNav;
}) => {
	const [
		{pid, text, type, url, timestamp, reply, likenum},
		setHoleTitle,
	] = useState<HoleTitleCard>(
		"lazy" in route.params
			? {...dummyHoleTitleCard, pid: route.params.pid}
			: route.params,
	);
	const [comments, setComments] = useState<HoleCommentCard[]>([]);
	const [myComment, setMyComment] = useState("");
	const [keyboardShown, setKeyboardShown] = useState(false);
	const [keyboardHeight, setKeyboardHeight] = useState(0);

	const headerHeight = useHeaderHeight();
	const screenHeight = Dimensions.get("window").height;

	Keyboard.addListener("keyboardWillShow", (eve) => {
		if (keyboardHeight === 0) {
			setKeyboardHeight(eve.endCoordinates.height);
		}
		setKeyboardShown(true);
	});
	Keyboard.addListener("keyboardWillHide", () => {
		setKeyboardShown(false);
	});

	useEffect(() => {
		getHoleDetail(pid)
			.then(([title, commentList]) => {
				setHoleTitle(title);
				setComments(commentList);
			})
			.catch(NetworkRetry);
		if ("lazy" in route.params) {
			getHoleDetail(pid)
				.then(([title]) => setHoleTitle(title))
				.catch(NetworkRetry);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<View
			style={{
				padding: 8,
				height: keyboardShown
					? screenHeight - headerHeight - keyboardHeight
					: undefined,
				flex: keyboardShown ? undefined : 1,
			}}>
			<ScrollView>
				<Text style={styles.smallHeader}>{getStr("originalText")}</Text>
				<View style={Material.card}>
					<Text style={styles.bigPid}>{`#${pid}`}</Text>
					<HoleMarkdown
						text={text}
						navigationHandler={(destPid) =>
							navigation.push("HoleDetail", {pid: destPid, lazy: true})
						}
					/>
					{type === "image" && (
						<Pressable
							onPress={() =>
								navigation.navigate("HoleImage", {
									url: holeConfig.imageBase + url,
								})
							}>
							<Image
								source={{uri: holeConfig.imageBase + url}}
								style={{height: 400}}
								resizeMode="contain"
							/>
						</Pressable>
					)}
					<View style={{height: 1, backgroundColor: "#ccc", margin: 2}} />
					<View style={{flexDirection: "row", justifyContent: "space-between"}}>
						<TimeAgo time={timestamp * 1000} />
						<View style={{flexDirection: "row"}}>
							{reply > 0 && (
								<View
									style={{
										flexDirection: "row",
										alignItems: "center",
									}}>
									<Text>{reply}</Text>
									<Icon name="comment" size={12} />
								</View>
							)}
							{likenum > 0 && (
								<View
									style={{
										flexDirection: "row",
										alignItems: "center",
									}}>
									<Text>{likenum}</Text>
									<Icon name="star-o" size={12} />
								</View>
							)}
						</View>
					</View>
				</View>
				{reply > 0 && (
					<Text style={styles.smallHeader}>{getStr("comments")}</Text>
				)}
				{comments.map((item) => {
					const replyContent = item.text;
					const splitIdx = replyContent.indexOf("]");

					const author = replyContent.substr(0, splitIdx + 1);
					const replyText = replyContent.substr(splitIdx + 2);
					return (
						<View style={Material.card} key={item.cid}>
							<Text style={styles.bigPid}>{`#${item.cid}`}</Text>
							<Text>{author}</Text>
							<HoleMarkdown
								text={replyText}
								navigationHandler={(destPid) =>
									navigation.push("HoleDetail", {pid: destPid, lazy: true})
								}
							/>
							{item.type === "image" && (
								<Pressable
									onPress={() =>
										navigation.navigate("HoleImage", {
											url: holeConfig.imageBase + item.url,
										})
									}>
									<Image
										source={{uri: holeConfig.imageBase + item.url}}
										style={{height: 400}}
										resizeMode="contain"
									/>
								</Pressable>
							)}
							<View style={{height: 1, backgroundColor: "#ccc", margin: 2}} />
							<TimeAgo time={item.timestamp * 1000} />
						</View>
					);
				})}
			</ScrollView>
			<View style={{flexDirection: "row", alignItems: "center"}}>
				<TextInput
					value={myComment}
					onChangeText={setMyComment}
					style={{
						flex: 1,
						textAlignVertical: "top",
						fontSize: 15,
						margin: 8,
						padding: 10,
						backgroundColor: "#FFF",
						borderColor: "lightgray",
						borderRadius: 5,
						borderWidth: 1,
					}}
					placeholder={getStr("holePublishHint")}
					multiline={true}
				/>
				<TouchableOpacity
					style={{
						backgroundColor: "#0002",
						flex: 0,
						margin: 4,
						borderRadius: 4,
						alignItems: "center",
						justifyContent: "center",
					}}
					onPress={() => {
						Snackbar.show({
							text: getStr("processing"),
							duration: Snackbar.LENGTH_SHORT,
						});
						postHoleComment(pid, myComment)
							.then(() => getHoleDetail(pid))
							.then(([_, commentList]) => setComments(commentList))
							.then(() => setMyComment(""))
							.catch(NetworkRetry);
					}}>
					<Text style={{textAlign: "center", padding: 10}}>
						{getStr("publish")}
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

export const styles = StyleSheet.create({
	smallHeader: {
		fontWeight: "bold",
		marginHorizontal: 10,
	},
	bigPid: {
		fontWeight: "bold",
		marginHorizontal: 12,
		marginBottom: 6,
		fontSize: 20,
	},
	smallCid: {
		fontWeight: "bold",
		marginHorizontal: 12,
		marginBottom: 6,
		fontSize: 16,
	},
});
