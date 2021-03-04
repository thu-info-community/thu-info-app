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
	Alert,
} from "react-native";
import React, {useEffect, useState} from "react";
import {HoleDetailRouteProp, HomeNav} from "./homeStack";
import {getStr} from "../../utils/i18n";
import {Material} from "../../constants/styles";
import {HoleMarkdown} from "../../components/home/hole";
import TimeAgo from "react-native-timeago";
import Icon from "react-native-vector-icons/FontAwesome";
import {HoleCommentCard, HoleTitleCard} from "../../models/hole";
import {
	deleteHole,
	getHoleDetail,
	holeConfig,
	postHoleComment,
	setHoleAttention,
} from "../../network/hole";
import Snackbar from "react-native-snackbar";
import {useHeaderHeight} from "@react-navigation/stack";
import {useColorScheme} from "react-native-appearance";
import themes from "../../assets/themes/themes";
import {launchImageLibrary} from "react-native-image-picker";

export const dummyHoleTitleCard = {
	pid: -1,
	text: "",
	type: "",
	url: "",
	timestamp: -1,
	reply: 0,
	likenum: 0,
	tag: "",
	attention: false,
	permissions: [],
};

export const HoleDetailScreen = ({
	route,
	navigation,
}: {
	route: HoleDetailRouteProp;
	navigation: HomeNav;
}) => {
	const [
		{pid, text, type, url, timestamp, reply, likenum, attention, permissions},
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
	const [base64, setBase64] = useState<string | undefined>();

	const headerHeight = useHeaderHeight();
	const screenHeight = Dimensions.get("window").height;

	const themeName = useColorScheme();
	const {colors} = themes[themeName];
	const MaterialTheme = Material(themeName);

	Keyboard.addListener("keyboardWillShow", (eve) => {
		if (keyboardHeight === 0) {
			setKeyboardHeight(eve.endCoordinates.height);
		}
		setKeyboardShown(true);
	});
	Keyboard.addListener("keyboardWillHide", () => {
		setKeyboardShown(false);
	});

	const errCallback = (e: Error) => {
		Snackbar.show({text: e.message, duration: Snackbar.LENGTH_SHORT});
	};

	const nothingWritten = (str: string) =>
		str.trim().length === 0 ||
		str
			.trim()
			.match(
				/^Re (?:|洞主|(?:[A-Z][a-z]+ )?(?:[A-Z][a-z]+)|You Win(?: \d+)?):$/,
			);

	useEffect(() => {
		getHoleDetail(pid)
			.then(([title, commentList]) => {
				setHoleTitle(title);
				setComments(commentList);
			})
			.catch(errCallback);
		if ("lazy" in route.params) {
			getHoleDetail(pid)
				.then(([title]) => setHoleTitle(title))
				.catch(errCallback);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<TouchableOpacity
					style={{paddingHorizontal: 16, marginHorizontal: 4}}
					onPress={() => {
						setHoleTitle((title) => {
							setHoleAttention(pid, !title.attention).catch((e) => {
								Snackbar.show({text: e, duration: Snackbar.LENGTH_SHORT});
							});
							return {...title, attention: !title.attention};
						});
					}}>
					<Icon
						name={attention ? "star" : "star-o"}
						size={24}
						color={colors.primary}
					/>
				</TouchableOpacity>
			),
		});
	}, [navigation, attention, colors.primary, pid]);

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
				<Text style={[styles.smallHeader, {color: colors.text}]}>
					{getStr("originalText")}
				</Text>
				<TouchableOpacity
					style={MaterialTheme.card}
					onPress={() => {
						if (nothingWritten(myComment)) {
							setMyComment("Re : ");
						}
					}}
					onLongPress={() => {
						if (permissions.includes("delete")) {
							Alert.alert(
								getStr("confirm"),
								getStr("deleteHoleConfirm"),
								[
									{text: getStr("cancel")},
									{
										text: getStr("confirm"),
										onPress: () => {
											deleteHole(pid, false)
												.then(() => navigation.pop())
												.catch(errCallback);
										},
									},
								],
								{cancelable: true},
							);
						}
					}}>
					<Text style={[styles.bigPid, {color: colors.text}]}>{`#${pid}`}</Text>
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
									<Text style={{color: colors.text}}>{reply}</Text>
									<Icon name="comment" size={12} color={colors.text} />
								</View>
							)}
							{likenum > 0 && (
								<View
									style={{
										flexDirection: "row",
										alignItems: "center",
									}}>
									<Text style={{color: colors.text}}>{likenum}</Text>
									<Icon name="star-o" size={12} color={colors.text} />
								</View>
							)}
						</View>
					</View>
				</TouchableOpacity>
				{reply > 0 && (
					<Text style={[styles.smallHeader, {color: colors.text}]}>
						{getStr("comments")}
					</Text>
				)}
				{comments.map((item) => {
					const replyContent = item.text;
					const splitIdx = replyContent.indexOf("]");

					const author = replyContent.substr(0, splitIdx + 1);
					const replyText = replyContent.substr(splitIdx + 2);
					return (
						<TouchableOpacity
							style={MaterialTheme.card}
							key={item.cid}
							onPress={() => {
								if (nothingWritten(myComment)) {
									setMyComment(`Re ${item.name}: `);
								}
							}}
							onLongPress={() => {
								if (item.permissions.includes("delete")) {
									Alert.alert(
										getStr("confirm"),
										getStr("deleteHoleConfirm"),
										[
											{text: getStr("cancel")},
											{
												text: getStr("confirm"),
												onPress: () => {
													deleteHole(item.cid, true)
														.then(() => getHoleDetail(pid))
														.then(([title, commentList]) => {
															setHoleTitle(title);
															setComments(commentList);
														})
														.catch(errCallback);
												},
											},
										],
										{cancelable: true},
									);
								}
							}}>
							<Text
								style={[
									styles.bigPid,
									{color: colors.text},
								]}>{`#${item.cid}`}</Text>
							<Text style={{color: colors.text}}>{author}</Text>
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
						</TouchableOpacity>
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
						backgroundColor: colors.background,
						borderColor: "lightgray",
						borderRadius: 5,
						borderWidth: 1,
						color: colors.text,
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
						if (base64) {
							setBase64(undefined);
						} else {
							launchImageLibrary(
								{mediaType: "photo", includeBase64: true},
								(response) => {
									setBase64(response.base64);
								},
							);
						}
					}}>
					<Text style={{textAlign: "center", padding: 10, color: colors.text}}>
						{getStr(base64 ? "removeImage" : "addImage")}
					</Text>
				</TouchableOpacity>
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
						postHoleComment(pid, myComment, base64)
							.then(() => getHoleDetail(pid))
							.then(([title, commentList]) => {
								setHoleTitle(title);
								setComments(commentList);
								setBase64(undefined);
								setMyComment("");
							})
							.catch(errCallback);
					}}>
					<Text style={{textAlign: "center", padding: 10, color: colors.text}}>
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
