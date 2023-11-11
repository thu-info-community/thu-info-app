import {ElementRef, useRef, useState} from "react";
import {RootNav, LibRoomPerformBookProp} from "../../components/Root";
import {
	convertUsageToSegments,
	LibRoomBookTimeIndicator,
	timeDiff,
} from "../../components/home/libRoomBookTimeIndicator";
import {
	Alert,
	Button,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {getStr} from "../../utils/i18n";
import Snackbar from "react-native-snackbar";
import {helper} from "../../redux/store";
import {LibFuzzySearchResult} from "@thu-info/lib/src/models/home/library";
import themes from "../../assets/themes/themes";
import {BottomPopupTriggerView} from "../../components/views";
import ScrollPicker from "react-native-wheel-scrollview-picker";
import {NetworkRetry} from "../../components/easySnackbars";
import dayjs from "dayjs";

interface Segment {
	start: string;
	duration: number; // Setting it -1 means we do not care duration
}

const formatTime = (h: number, m: number) =>
	`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

export const LibRoomPerformBookScreen = ({
	route: {
		params: {res, date},
	},
	navigation,
}: {
	route: LibRoomPerformBookProp;
	navigation: RootNav;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const today = dayjs().format("YYYY-MM-DD");
	const now = dayjs().format("HH:mm");

	const segments = convertUsageToSegments(res);
	const validBegs: Segment[] = segments
		.filter(([_, duration, occupied]) => duration >= res.minMinute && !occupied)
		.flatMap(([start, duration]) => {
			const startH = Number(start.substring(0, 2));
			const startM = Number(start.substring(3, 5));
			return Array.from(
				new Array(Math.floor((duration - res.minMinute) / 5) + 1),
				(_, k) => {
					let m = startM + k * 5;
					let h = startH + Math.floor(m / 60);
					m -= Math.floor(m / 60) * 60;
					return {
						start: formatTime(h, m),
						duration: duration - k * 5,
					} as Segment;
				},
			);
		})
		.filter(({start}) => date > today || start > now);

	const genValidEnds = (beg: string): Segment[] => {
		const item = validBegs.find((e) => e.start === beg) ?? validBegs[0];
		const result: Segment[] = [];
		const {start, duration} = item;
		let h = Number(beg.substring(0, 2));
		let m = Number(beg.substring(3, 5)) + res.minMinute;
		for (
			let i = 0;
			i < Math.floor((duration - res.minMinute - timeDiff(start, beg)) / 5) + 1;
			i++
		) {
			h += Math.floor(m / 60);
			m -= Math.floor(m / 60) * 60;
			result.push({start: formatTime(h, m), duration: -1});
			m += 5;
		}
		return result;
	};

	const [begValue, setBegValue] = useState<string | null>(
		validBegs.length > 0 ? validBegs[0].start ?? null : null,
	);
	const validEnds = begValue ? genValidEnds(begValue) : [];
	const [endValue, setEndValue] = useState<string | null>(
		validEnds.length > 0 ? validEnds[0].start ?? null : null,
	);

	const rightScrollRef = useRef<ElementRef<typeof ScrollPicker>>(null);

	const [members, setMembers] = useState<LibFuzzySearchResult[]>([
		{id: helper.getLibraryRoomAccNo(), label: "自己", department: ""},
	]);
	const [userKeyword, setUserKeyword] = useState<string>("");
	const [userItems, setUserItems] = useState<LibFuzzySearchResult[]>([]);

	const [processing, setProcessing] = useState(false);

	const canSubmit =
		begValue !== null &&
		endValue !== null &&
		members.length <= res.maxUser &&
		members.length >= res.minUser &&
		!processing;

	const performBook = () => {
		Snackbar.show({
			text: getStr("processing"),
			duration: Snackbar.LENGTH_SHORT,
		});
		setProcessing(true);
		helper
			.bookLibraryRoom(
				res,
				`${date} ${begValue}:00`,
				`${date} ${endValue}:00`,
				members.map((member) => member.id),
			)
			.then(() => {
				Snackbar.show({
					text: getStr("success"),
					duration: Snackbar.LENGTH_SHORT,
				});
				Alert.alert(getStr("warning"), getStr("libRoomFirstTime"));
				navigation.pop();
			})
			.catch((e) => {
				if (String(e).includes("填写邮箱地址")) {
					helper
						.getUserInfo()
						.then(({emailName}) => {
							const email = `${emailName}@mails.tsinghua.edu.cn`;
							Alert.alert(getStr("warning"), `您的邮箱地址为 ${email}？`, [
								{
									text: getStr("cancel"),
									style: "cancel",
								},
								{
									text: getStr("ok"),
									onPress: () => {
										helper
											.updateLibraryRoomEmail(email)
											.then(() => {
												performBook();
											})
											.catch(NetworkRetry);
									},
								},
							]);
						})
						.catch(NetworkRetry);
				} else {
					NetworkRetry(e);
				}
			})
			.then(() => setProcessing(false));
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={{flex: 1}}>
			<ScrollView style={{padding: 16}}>
				<Text
					style={{
						textAlign: "left",
						fontSize: 15,
						marginTop: 18,
						marginLeft: 12,
						marginBottom: 8,
						fontWeight: "bold",
						color: colors.text,
					}}>
					{getStr("occupation")}
				</Text>
				<View
					style={{
						backgroundColor: colors.contentBackground,
						shadowColor: "grey",
						borderRadius: 20,
						paddingHorizontal: 12,
						paddingVertical: 16,
					}}>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
						}}>
						<Text
							style={{marginHorizontal: 8, color: colors.fontB3, fontSize: 16}}>
							{getStr("libRoomBookDate")}
						</Text>
						<Text
							style={{
								marginHorizontal: 5,
								color: colors.text,
								fontSize: 16,
							}}>
							{date}
						</Text>
					</View>
					<View style={{margin: 12}}>
						<LibRoomBookTimeIndicator res={res} />
					</View>
				</View>
				<Text
					style={{
						textAlign: "left",
						fontSize: 15,
						marginTop: 18,
						marginLeft: 12,
						marginBottom: 8,
						fontWeight: "bold",
						color: colors.text,
					}}>
					{getStr("libRoomBookInfo")}
				</Text>
				<View
					style={{
						backgroundColor: colors.contentBackground,
						shadowColor: "grey",
						borderRadius: 20,
						paddingHorizontal: 12,
						paddingVertical: 16,
					}}>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
						}}>
						<Text
							style={{
								marginHorizontal: 8,
								color: colors.fontB3,
								fontSize: 16,
							}}>
							{getStr("libRoomBookTime")}
						</Text>
						<BottomPopupTriggerView
							style={{
								flexDirection: "row",
								marginVertical: 4,
								alignItems: "center",
							}}
							popupTitle={getStr("libRoomBookTime")}
							popupContent={
								<View style={{flexDirection: "row"}}>
									<ScrollPicker
										style={{flex: 1}}
										dataSource={validBegs.map((val) => val.start)}
										selectedIndex={validBegs.findIndex(
											(val) => val.start === begValue,
										)}
										renderItem={(data) => (
											<Text
												style={{color: colors.fontB1, fontSize: 20}}
												key={data}>
												{data}
											</Text>
										)}
										onValueChange={(value) => {
											setBegValue(value);
											const newValidEnds = genValidEnds(value);
											setEndValue(newValidEnds[0].start ?? null);
											rightScrollRef.current?.scrollToTargetIndex(0);
										}}
									/>
									<ScrollPicker
										style={{flex: 1}}
										ref={rightScrollRef}
										dataSource={validEnds.map((val) => val.start)}
										selectedIndex={validEnds.findIndex(
											(val) => val.start === endValue,
										)}
										renderItem={(data) => (
											<Text
												style={{color: colors.fontB1, fontSize: 20}}
												key={data}>
												{data}
											</Text>
										)}
										onValueChange={(value) => {
											setEndValue(value);
										}}
									/>
								</View>
							}
							popupCanFulfill={true}
							popupOnFulfilled={() => {}}
							popupOnCancelled={() => {}}>
							<Text
								style={{
									marginHorizontal: 5,
									color: colors.text,
									fontSize: 16,
								}}>
								{begValue === null || endValue === null
									? getStr("selectTime")
									: begValue + "~" + endValue}
							</Text>
						</BottomPopupTriggerView>
					</View>
					{res.maxUser > 1 && (
						<View>
							<View
								style={{backgroundColor: "lightgray", height: 1, margin: 8}}
							/>
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
								}}>
								<Text
									style={{
										marginHorizontal: 8,
										color: colors.fontB3,
										fontSize: 16,
									}}>
									{getStr("groupMembers")}
								</Text>
								<Text
									style={{
										marginHorizontal: 4,
										color: colors.fontB3,
										fontSize: 16,
									}}>
									({res.minUser}~{res.maxUser})
								</Text>
							</View>
							<Text style={{margin: 8, color: colors.text}}>
								{getStr("findUser")}
							</Text>
							<View
								style={{
									flexDirection: "row",
									justifyContent: "center",
									alignItems: "center",
									marginBottom: 12,
								}}>
								<TextInput
									style={{
										backgroundColor: colors.themeBackground,
										color: colors.text,
										textAlign: "left",
										borderColor: "lightgrey",
										borderWidth: 1,
										borderRadius: 5,
										padding: 6,
										flex: 1,
										fontSize: 16,
										marginHorizontal: 4,
									}}
									onChangeText={(text) => {
										setUserKeyword(text);
									}}
									value={userKeyword}
								/>
								<Button
									title={getStr("search")}
									disabled={userKeyword.length === 0}
									onPress={() => {
										helper.fuzzySearchLibraryId(userKeyword).then((r) => {
											if (r.length === 0) {
												Alert.alert("没有搜索到匹配的用户");
												setUserItems([]);
												setUserKeyword("");
											} else if (r.length === 1) {
												const id = r[0].id;
												setMembers((prev) => {
													if (id === undefined) {
														Alert.alert("用户不合法");
														return prev;
													} else if (prev.some((e) => e.id === id)) {
														Alert.alert("用户已经成为使用者");
														return prev;
													} else {
														return prev.concat(r[0]);
													}
												});
												setUserItems([]);
												setUserKeyword("");
											} else {
												setUserItems(r);
											}
										});
									}}
								/>
							</View>
							{userItems.length === 0 ? null : (
								<View>
									<Text
										style={{
											marginLeft: 4,
											marginBottom: 4,
											color: colors.text,
										}}>
										有多名用户符合要求，点按以选择用户
									</Text>
									<View
										style={{
											marginLeft: 4,
											flexWrap: "wrap",
											flex: 1,
											flexDirection: "row",
											marginBottom: 4,
										}}>
										{[
											<TouchableOpacity
												style={{
													backgroundColor: colors.contentBackground,
													borderColor: "gray",
													borderRadius: 5,
													borderWidth: 1,
													paddingHorizontal: 4,
													margin: 4,
													justifyContent: "center",
												}}
												onPress={() => setUserItems([])}>
												<View
													style={{flexDirection: "row", paddingVertical: 8}}>
													<Text style={{color: colors.statusWarning}}>
														取消搜索
													</Text>
												</View>
											</TouchableOpacity>,
										].concat(
											userItems.map((item) => (
												<TouchableOpacity
													onPress={() =>
														Alert.alert(
															`${getStr("choose")} ${item.label} ${
																item.department
															} ${getStr("questionMark")}`,
															undefined,
															[
																{text: getStr("cancel")},
																{
																	text: getStr("confirm"),
																	onPress: () => {
																		setMembers((prev) => {
																			if (item.id === undefined) {
																				Alert.alert("用户不合法");
																				return prev;
																			} else if (
																				prev.some((e) => e.id === item.id)
																			) {
																				Alert.alert("用户已经成为使用者");
																				return prev;
																			} else {
																				return prev.concat(item);
																			}
																		});
																		setUserItems([]);
																		setUserKeyword("");
																	},
																},
															],
															{cancelable: true},
														)
													}
													key={item.id}
													style={{
														backgroundColor: colors.contentBackground,
														borderColor: colors.fontB2,
														borderRadius: 5,
														borderWidth: 1,
														paddingHorizontal: 4,
														margin: 4,
														justifyContent: "center",
													}}>
													<View
														style={{flexDirection: "row", paddingVertical: 8}}>
														<Text style={{color: colors.fontB2}}>
															{item.label} {item.department}
														</Text>
													</View>
												</TouchableOpacity>
											)),
										)}
									</View>
								</View>
							)}
							<Text
								style={{marginLeft: 4, marginBottom: 4, color: colors.text}}>
								已有研读间使用者（点按可删除）
							</Text>
							<View
								style={{
									marginLeft: 4,
									flexWrap: "wrap",
									flex: 1,
									flexDirection: "row",
									marginBottom: 4,
								}}>
								{members.map((member) => (
									<TouchableOpacity
										disabled={member.id === helper.getLibraryRoomAccNo()}
										onPress={() =>
											Alert.alert(
												`${getStr("delete")} ${member.label} ${
													member.department
												}？`,
												undefined,
												[
													{text: getStr("cancel")},
													{
														text: getStr("confirm"),
														onPress: () =>
															setMembers((prev) =>
																prev.filter((it) => it.id !== member.id),
															),
													},
												],
												{cancelable: true},
											)
										}
										key={member.id}
										style={{
											backgroundColor: colors.contentBackground,
											borderColor: "gray",
											borderRadius: 5,
											borderWidth: 1,
											paddingHorizontal: 4,
											margin: 4,
											justifyContent: "center",
										}}>
										<View style={{flexDirection: "row", paddingVertical: 8}}>
											<Text style={{color: colors.fontB2}}>{member.label}</Text>
										</View>
									</TouchableOpacity>
								))}
							</View>
						</View>
					)}
					<View
						style={{
							flexDirection: "row",
							justifyContent: "center",
							marginVertical: 24,
						}}>
						<TouchableOpacity
							style={{
								backgroundColor: canSubmit
									? colors.primaryLight
									: colors.mainTheme,
								alignItems: "center",
								justifyContent: "center",
								paddingVertical: 8,
								paddingHorizontal: 24,
								borderRadius: 4,
							}}
							disabled={!canSubmit}
							onPress={performBook}>
							<Text
								style={{
									color: canSubmit
										? colors.contentBackground
										: colors.themeGrey,
									fontSize: 16,
								}}>
								{getStr(processing ? "processing" : "submit")}
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
};
