import {
	FlatList,
	Modal,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	Text,
	TextInput,
	TouchableOpacity,
	useColorScheme,
	View,
	Alert,
	SectionList,
	ActivityIndicator,
	Pressable,
	Animated,
	useWindowDimensions,
} from "react-native";
import {useEffect, useRef, useState} from "react";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import IconAdd from "../../assets/icons/IconAdd.tsx";
import IconHamburgerMenu from "../../assets/icons/IconHamburgerMenu.tsx";
import IconSend from "../../assets/icons/IconSend.tsx";
import EventSource from "react-native-sse";
import {v4 as uuidv4} from "uuid";
import Markdown from "react-native-markdown-display";
import {helper, State} from "../../redux/store.ts";
import {
	MADMODEL_AUTH_LOGIN_URL,
	MADMODEL_BASE_URL,
} from "@thu-info/lib/src/constants/strings.ts";
import {useDispatch, useSelector} from "react-redux";
import {configSet} from "../../redux/slices/config.ts";
import Snackbar from "react-native-snackbar";
import IconDeepSeek from "../../assets/icons/IconDeepSeek.tsx";
import IconDropdown from "../../assets/icons/IconDropdown.tsx";
import IconCheck from "../../assets/icons/IconCheck.tsx";
import IconCopy from "../../assets/icons/IconCopy.tsx";
import IconRefresh from "../../assets/icons/IconRefresh.tsx";
import {getStatusBarHeight} from "react-native-safearea-height";
import {
	deepseekClear,
	deepseekUpdateHistory,
	deepseekDeleteConversation,
} from "../../redux/slices/deepseek.ts";
import {ChannelTag} from "@thu-info/lib/src/models/news/news.ts";
import themedStyles from "../../utils/themedStyles.ts";
import {DeepSeekTabProp} from "../../components/Root.tsx";
import Clipboard from "@react-native-clipboard/clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface Message {
	role: "system" | "user" | "assistant" | "tool";
	content: string; // We currently do not support multi-modal.
	timestamp?: number;
}

export interface Conversation {
	id: string;
	title: string;
	messages: Message[];
	timestamp?: number;
}

const splitReasoningAndStatus = (
	answer: string,
): [
	string,
	string,
	"searching" | "reasoning" | "reasoningDone" | "deepseek",
] => {
	const beginTag = "<think>";
	const endTag = "</think>";
	if (answer.startsWith("嗯，") || answer.startsWith("好的，")) {
		answer = beginTag + answer;
	}
	if (answer.includes(beginTag) && answer.includes(endTag)) {
		const beginPos = answer.indexOf(beginTag);
		const endPos = answer.indexOf(endTag);
		return [
			answer.substring(beginPos + beginTag.length, endPos).trim(),
			answer.substring(endPos + endTag.length).trim(),
			"reasoningDone",
		];
	} else if (answer.includes(endTag)) {
		const endPos = answer.indexOf(endTag);
		return [
			answer.substring(0, endPos).trim(),
			answer.substring(endPos + endTag.length),
			"reasoningDone",
		];
	} else if (answer.includes(beginTag)) {
		const beginPos = answer.indexOf(beginTag);
		return [answer.substring(beginPos + beginTag.length), "", "reasoning"];
	} else {
		return ["", answer, "deepseek"];
	}
};

const models = ["DeepSeek-R1-Distill-32B", "DeepSeek-R1-671B"];

const systemErrorMessage = "服务器繁忙,请稍后再试";

const newConversation = (): Conversation => ({
	id: uuidv4(),
	title: getStr("newConversation"),
	messages: [],
	timestamp: Date.now(),
});

const sendDeepSeekMessage = async ({
	input,
	conversation,
	dataSource,
	setSearching,
	model,
	deepseekToken,
	dispatch,
}: {
	input: string;
	conversation: Conversation;
	dataSource: ChannelTag | undefined | null;
	setSearching: React.Dispatch<React.SetStateAction<boolean>>;
	model: string;
	deepseekToken: string;
	dispatch: any;
}) => {
	let next = {
		...conversation,
		messages: conversation.messages.concat({
			role: "user",
			content: input.trim(),
			timestamp: Date.now(),
		}, {
			role: "assistant",
			content: "",
			timestamp: Date.now(),
		}),
	};
	dispatch(deepseekUpdateHistory(next));

	let prompt = input.trim();

	if (conversation.title === getStr("newConversation")) {
		generateConversationTitle(prompt, deepseekToken).then((title) => {
			next = {
				...next,
				title,
			};
			dispatch(deepseekUpdateHistory(next));
		});
	}

	if (dataSource !== null) {
		setSearching(true);
		const {choices} = await (await fetch(`${MADMODEL_BASE_URL}/v1/chat/completions`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${deepseekToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: models[0],
				messages: [
					{
						role: "system",
						content: "你的任务是从用户的输入中提取关键词，用于RAG搜索。请提取3-5个最相关的关键词，每个关键词不应超过4个字，确保它们简洁且能准确反映用户输入的核心内容。你提取的关键词必须是中文，除非用户的关键词是特定的专有名词、术语或其他关键信息。你必须直接给我这些关键词，以符号+连接每个关键词。\n---\n" + prompt,
					},
				],
				temperature: 0.2,
				repetition_penalty: 1.05,
				stream: false,
			}),
		})).json();
		const answer = choices[0].message.content;
		const keywords = splitReasoningAndStatus(answer)[1];
		const newsList = await helper.searchNewsList(1, keywords, dataSource);
		const newsDetail = [];
		for (let newsSlice of newsList.slice(0, 5)) {
			try {
				const [title, _content, abstract] = await helper.getNewsDetail(newsSlice.url);
				newsDetail.push(`# ${title}\n${abstract}`);
			} catch {
				// No-op
			}
		}
		prompt = `请根据下面新闻回答问题：

${newsDetail.join("\n\n")}

问题：
${prompt}

---

补充信息：
- 用户当前的时间是${new Date().toLocaleString("zh-CN", { hour12: false })}`;
		setSearching(false);
	}

	const es = new EventSource(`${MADMODEL_BASE_URL}/v1/chat/completions`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${deepseekToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model,
			messages: [
				...conversation.messages.map((message) =>
					message.role === "assistant"
						? {
								...message,
								content: splitReasoningAndStatus(message.content)[1],
					     }
						: message,
				),
				{
					role: "user",
					content: prompt,
				},
			],
			temperature: 0.6,
			repetition_penalty: 1.05,
			stream: true,
		}),
		pollingInterval: 0,
	});

	await new Promise<void>((resolve, reject) => {
		es.addEventListener("message", (event) => {
			if (event.data) {
				if (event.data.trim() === "[DONE]") {
					resolve();
				} else {
					const value = JSON.parse(event.data);
					if (value.errorMessage) {
						const prev = next;
						next = {
							...prev,
							messages: prev.messages
								.slice(0, prev.messages.length - 1)
								.concat({
									role: "assistant",
									content:
										prev.messages[prev.messages.length - 1].content +
										value.errorMessage,
									timestamp: Date.now(),
								}),
						};
						dispatch(deepseekUpdateHistory(next));
						resolve();
						return;
					}
					const choice = value.choices[0];
					if (choice?.delta == null) {
						return;
					}
					const delta = choice.delta;
					if (delta.content != null) {
						const prev = next;
						next = {
							...prev,
							messages: prev.messages
								.slice(0, prev.messages.length - 1)
								.concat({
									role: "assistant",
									content:
										prev.messages[prev.messages.length - 1].content +
										delta.content,
									timestamp: Date.now(),
								}),
						};
						dispatch(deepseekUpdateHistory(next));
					}
				}
			}
		});
		es.addEventListener("error", (event) => {
			if (event.type === "error" || event.type === "exception") {
				reject(new Error(event.message));
			} else {
				reject(new Error(event.type));
			}
		});
		es.addEventListener("close", () => {
			resolve();
		});
	});

};

async function generateConversationTitle(content: string, deepseekToken: string): Promise<string> {
	const { choices } = await (await fetch(`${MADMODEL_BASE_URL}/v1/chat/completions`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${deepseekToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: models[0],
			messages: [
				{
					role: "system",
					content: getStr("summaryPrompt") + content + "}}",
				},
			],
			temperature: 0.6,
			repetition_penalty: 1.05,
			stream: false,
		}),
	})).json();
	const answer = choices[0].message.content;
	return splitReasoningAndStatus(answer)[1].trim();
}

export const DeepSeekScreen = ({route: {params}}: {route: DeepSeekTabProp}) => {
	const [input, setInput] = useState("");
	const [generating, setGenerating] = useState(false);
	const [open, setOpen] = useState(false);
	const [dataSource, setDataSource] = useState<ChannelTag | undefined | null>(
		null,  // null indicates that no data source should be used
	);
	const [searching, setSearching] = useState(false);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const sidebarPosition = useRef(new Animated.Value(-1)).current;

	const [model, setModel] = useState<string>(models[0]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [searchKey, setSearchKey] = useState("");
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const {deepseekToken} = useSelector((s: State) => s.config);
	const {history} = useSelector((s: State) => s.deepseek);
	const {bubbleMessage} = useSelector((s: State) => s.config);
	const dispatch = useDispatch();

	const inputRef = useRef<TextInput>(null);

	const style = styles(themeName);

	const insets = useSafeAreaInsets();

	useEffect(() => {
		if (!deepseekToken) {
			helper.getMadModelToken().then((token) => {
				dispatch(configSet({key: "deepseekToken", value: token}));
			});
		} else {
			fetch(MADMODEL_AUTH_LOGIN_URL, {
				headers: {
					Authorization: `Bearer ${deepseekToken}`,
				},
			})
				.then((res) => res.json())
				.then(({success}) => {
					if (!success) {
						helper.getMadModelToken().then((token) => {
							dispatch(configSet({key: "deepseekToken", value: token}));
						});
					}
				});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (params) {
			setInput(params.prompt);
			setDataSource(params.dataSource);
		}
	}, [params]);

	useEffect(() => {
		if (
			history.length === 0 ||
			Date.now() - (history[0].timestamp ?? 0) > 1000 * 60 * 30
		) {
			dispatch(deepseekUpdateHistory(newConversation()));
		}
		setCurrentIndex(0);
	}, [history, dispatch]);

	const conversation = history[currentIndex] || newConversation();

	const createConversation = () => {
		if (history.length === 0 || history[0].messages.length !== 0) {
			dispatch(deepseekUpdateHistory(newConversation()));
		} else {
			currentIndex === 0 && Snackbar.show({
				text: getStr("alreadyLatestChat"),
				duration: Snackbar.LENGTH_SHORT,
			});
		}
		setCurrentIndex(0);
		toggleSidebar(false);
		inputRef.current?.focus();
	};

	const deleteAllHistory = () => {
		Alert.alert(
			getStr("delete"),
			getStr("deleteAllHistoryConfirm"),
			[
				{
					text: getStr("cancel"),
					style: "cancel",
				},
				{
					text: getStr("confirm"),
					onPress: () => {
						dispatch(deepseekClear());
						toggleSidebar(false);
					},
				},
			],
			{cancelable: true},
		);
	};

	const refreshMessage = async (
		messageIndex: number,
		newDataSource: ChannelTag | undefined | null,
	) => {
		if (generating || !deepseekToken) {
			return;
		}

		setGenerating(true);
		try {
			const userMessage = conversation.messages[messageIndex - 1];
			if (!userMessage || userMessage.role !== "user") {
				return;
			}

			const tempConversation = {
				...conversation,
				messages: conversation.messages.slice(0, messageIndex - 1),
			};

			await sendDeepSeekMessage({
				input: userMessage.content,
				conversation: tempConversation,
				dataSource: newDataSource,
				setSearching,
				model,
				deepseekToken,
				dispatch,
			});
		} catch (e: any) {
			Snackbar.show({
				text: getStr("loginTimeoutRetry") + e?.message,
				duration: Snackbar.LENGTH_SHORT,
			});
		} finally {
			setGenerating(false);
		}
	};

	const toggleSidebar = (open: boolean) => {
		Animated.timing(sidebarPosition, {
			toValue: open ? 0 : -1, // 0 for visible, -1 for hidden
			duration: 300,
			useNativeDriver: true,
		}).start(() => {
			if (!open) {
				setSidebarOpen(false); // Close modal after animation
			}
		});
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={{
				flex: 1,
				paddingTop: getStatusBarHeight(),
				flexDirection: "column",
			}}>
			<View
				style={{
					flexDirection: "row",
					height: 40,
					padding: 4,
					alignItems: "center",
				}}>
				<TouchableOpacity
					style={{
						flex: 0,
						alignItems: "center",
						justifyContent: "center",
						padding: 4,
						marginStart: 2,
					}}
					onPress={() => {
						setSidebarOpen(true);
						toggleSidebar(true);
					}}>
					<IconHamburgerMenu height={24} width={24} />
				</TouchableOpacity>
				<View style={{flex: 1}}>
					{conversation.messages.length > 0 ? (
						<Text style={{color: colors.text, textAlign: "center"}}>
							{conversation.title}
						</Text>
					) : (
						<TouchableOpacity
							style={{
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "center",
							}}
							onPress={() => setOpen(true)}>
							<Text style={{color: open ? colors.primary : colors.fontB2}}>
								{model}
							</Text>
							<View style={{marginStart: 6}}>
								<IconDropdown
									width={6}
									height={4}
									color={open ? colors.primary : colors.fontB2}
								/>
							</View>
						</TouchableOpacity>
					)}
				</View>
				<TouchableOpacity
					style={{
						flex: 0,
						alignItems: "center",
						justifyContent: "center",
						padding: 4,
						marginEnd: 2,
					}}
					onPress={createConversation}>
					<IconAdd height={24} width={24} />
				</TouchableOpacity>
				<Modal visible={open} transparent>
					<TouchableOpacity
						style={{
							width: "100%",
							height: "100%",
						}}
						activeOpacity={1}
						onPress={() => setOpen(false)}>
						<View
							style={{
								position: "absolute",
								backgroundColor: colors.text,
								opacity: 0.3,
								width: "100%",
								top: getStatusBarHeight(true) + 40,
								bottom: 0,
							}}
						/>
						<View
							style={{
								position: "absolute",
								backgroundColor: colors.contentBackground,
								width: "100%",
								top: getStatusBarHeight(true) + 40,
								borderBottomStartRadius: 12,
								borderBottomEndRadius: 12,
							}}>
							<FlatList
								data={models}
								renderItem={({item, index}) => {
									const showTick = models[index] === model;
									return (
										<TouchableOpacity
											onPress={() => {
												setModel(models[index]);
												setOpen(false);
											}}
											style={{
												paddingHorizontal: 12,
												marginVertical: 8,
												flexDirection: "row",
												justifyContent: "space-between",
											}}>
											<Text style={{color: colors.text, fontSize: 14}}>
												{item}
											</Text>
											{showTick ? <IconCheck height={18} width={18} /> : null}
										</TouchableOpacity>
									);
								}}
								keyExtractor={(item) => item}
							/>
						</View>
					</TouchableOpacity>
				</Modal>
			</View>
			<FlatList
				style={{
					padding: 16,
					paddingStart: 8,
				}}
				data={conversation.messages}
				keyExtractor={(item, index) =>
					item.timestamp?.toString() + item.role + index.toString()
				}
				renderItem={({item, index}) => {
					if (item.role === "user") {
						return (
							<View style={{flexDirection: "row", justifyContent: "flex-end"}}>
								<View
									style={{
										flexDirection: "column",
									}}>
									<Text
										style={{
											color: colors.fontB3,
											textAlign: "right",
											fontSize: 13,
										}}>
										{new Date(item.timestamp ?? 0).toLocaleString([], {
											month: "numeric",
											day: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</Text>
									<View
										style={{
											backgroundColor: colors.themeTransparentPurple,
											borderRadius: 8,
											paddingVertical: 8,
											paddingHorizontal: 12,
											marginLeft: 40,
											marginVertical: 4,
										}}>
										<Pressable
											onLongPress={() => {
												Clipboard.setString(item.content);
												Snackbar.show({
													text: getStr("copied"),
													duration: Snackbar.LENGTH_SHORT,
												});
											}}>
											<Text style={{ color: colors.text }}>{item.content}</Text>
										</Pressable>
									</View>
								</View>
							</View>
						);
					} else if (item.role === "assistant") {
						const [reasoning, answer, statusText] = splitReasoningAndStatus(
							item.content,
						);
						return (
							<View
								style={{
									flexDirection: "row",
									marginTop: 2,
									marginBottom: 8,
									marginEnd: 4,
									padding: 8,
								}}>
								<View
									style={{
										height: 20,
										width: 20,
										alignItems: "center",
										justifyContent: "center",
										flex: 0,
									}}>
									<IconDeepSeek width={20} height={20} />
								</View>
								<View
									style={{
										flex: 1,
										minWidth: 0,
										paddingStart: 4,
										alignItems: "flex-start",
									}}>
									<Text style={{color: colors.fontB3}}>
										{searching && index === conversation.messages.length - 1 ? getStr("searching") : getStr(statusText)}
										&nbsp;&nbsp;
										{new Date(item.timestamp ?? 0).toLocaleString([], {
											month: "numeric",
											day: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</Text>
									{item.content.length !== 0 ? (
										<View
											style={{
												borderRadius: 8,
												backgroundColor: bubbleMessage
													? colors.contentBackground
													: colors.themeBackground,
												paddingHorizontal: bubbleMessage ? 12 : 0,
												marginVertical: 4,
												paddingBottom: 8,
											}}>
											{reasoning.trim().length > 0 && (
												<View
													style={{
														marginTop: 8,
														flexDirection: "row",
													}}>
													<View
														style={{
															height: "100%",
															width: 2,
															marginStart: -2,
															backgroundColor: colors.fontB3,
														}}
													/>
													<Text
														style={{
															color: colors.fontB3,
															marginLeft: 8,
															textAlign: "justify",
														}}>
														{reasoning}
													</Text>
												</View>
											)}
											{answer.trim().length > 0 && (
												<Markdown
													style={{
														body: {
															color: colors.text,
															backgroundColor: colors.transparent,
															textAlign: "justify",
														},
														fence: {
															backgroundColor: colors.themeTransparentGrey,
														},
														paragraph: {
															marginBottom: 2,
															textAlign: "justify",
														},
													}}>
													{answer}
												</Markdown>
											)}
										</View>
									) : (
										<ActivityIndicator
											size="small"
											color={colors.themeTransparentPurple}
										/>
									)}
									{(index !== conversation.messages.length - 1 || !generating) && item.content !== systemErrorMessage && (
										<View
											style={{
												backgroundColor: `${colors.themeLightPurple}33`,
												borderRadius: 8,
												borderWidth: 1,
												borderColor: colors.themePurple,
												paddingVertical: 8,
												paddingHorizontal: 12,
												marginVertical: 4,
												width: "100%",
												alignItems: "center",
												justifyContent: "center",
											}}>
											<Text style={{color: colors.themePurple, fontSize: 12}}>
												{getStr("aigcWarning")}
											</Text>
										</View>
									)}
									<View
										style={[
											{flexDirection: "row"},
											index === conversation.messages.length - 1 && generating ? {display: "none"} : {},
										]}>
										<TouchableOpacity
											style={{
												padding: 2,
											}}
											disabled={generating}
											onPress={() => {
												Clipboard.setString(answer);
												Snackbar.show({
													text: getStr("copied"),
													duration: Snackbar.LENGTH_SHORT,
												});
											}}>
											<IconCopy height={18} width={18} color={colors.fontB3} />
										</TouchableOpacity>
										{index === conversation.messages.length - 1 && (
											<TouchableOpacity
												style={{
													padding: 2,
												}}
												disabled={generating}
												onPress={() => {
													refreshMessage(index, dataSource);
												}}>
												<IconRefresh
													height={18}
													width={18}
													color={colors.fontB3}
												/>
											</TouchableOpacity>
										)}
									</View>
								</View>
							</View>
						);
					} else {
						return null;
					}
				}}
				ListEmptyComponent={
					<View
						style={{
							alignItems: "center",
							justifyContent: "center",
							paddingTop: "50%",
							marginStart: 8,
						}}>
						<IconDeepSeek width={60} height={60} />
						<Text style={{color: colors.text, fontSize: 16, marginTop: 8}}>
							{getStr("deepseekWelcomeText")}
						</Text>
					</View>
				}
			/>
			<View
				style={{
					flex: 0,
					flexDirection: "row",
					padding: 0,
					paddingStart: 16,
				}}>
				<TouchableOpacity
					onPress={() =>
						setDataSource((prev) =>
							prev === "LM_JWGG" ? null : "LM_JWGG",
						)
					}
					style={[
						style.capsule,
						dataSource === "LM_JWGG"
							? {
								backgroundColor: colors.themeTransparentPurple,
								borderColor: colors.transparent,
							}
							: {},
					]}>
					<Text
						style={{
							color: dataSource === "LM_JWGG" ? colors.fontB1 : colors.fontB2,
							fontSize: 13,
						}}>
						{getStr("LM_JWGG")}
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() =>
						setDataSource((prev) =>
							prev === "LM_XSBGGG" ? null : "LM_XSBGGG",
						)
					}
					style={[
						style.capsule,
						dataSource === "LM_XSBGGG"
							? {
									backgroundColor: colors.themeTransparentPurple,
									borderColor: colors.transparent,
						      }
							: {},
					]}>
					<Text
						style={{
							color:
								dataSource === "LM_XSBGGG" ? colors.fontB1 : colors.fontB2,
							fontSize: 13,
						}}>
						{getStr("LM_XSBGGG")}
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() =>
						setDataSource((prev) =>
							prev === "LM_BYJYXX" ? null : "LM_BYJYXX",
						)
					}
					style={[
						style.capsule,
						dataSource === "LM_BYJYXX"
							? {
									backgroundColor: colors.themeTransparentPurple,
									borderColor: colors.transparent,
						      }
							: {},
					]}>
					<Text
						style={{
							color: dataSource === "LM_BYJYXX" ? colors.fontB1 : colors.fontB2,
							fontSize: 13,
						}}>
						{getStr("LM_BYJYXX")}
					</Text>
				</TouchableOpacity>
			</View>
			<View
				style={{
					flex: 0,
					flexDirection: "row",
					alignItems: "center",
				}}>
				<TextInput
					ref={inputRef}
					value={input}
					onChangeText={setInput}
					style={{
						flex: 1,
						textAlignVertical: "center",
						fontSize: 14,
						marginBottom: 4,
						marginHorizontal: 8,
						padding: 12,
						paddingEnd: 36,
						color: colors.text,
						borderColor: colors.themePurple,
						borderWidth: 1.5,
						borderRadius: 24,
					}}
					textAlignVertical="top"
					multiline={true}
					placeholder={getStr("askDeepSeekPrompt")}
					placeholderTextColor={colors.fontB3}
				/>
				<TouchableOpacity
					style={{position: "absolute", right: 24, bottom: 16}}
					disabled={input.trim() === "" || generating}
					onPress={async () => {
						if (input.trim() === "" || generating || !deepseekToken) {
							return;
						}
						setInput("");
						Keyboard.dismiss();
						setGenerating(true);
						try {
							await sendDeepSeekMessage({
								input,
								conversation,
								dataSource,
								setSearching,
								model,
								deepseekToken,
								dispatch,
							});
						} catch (e: any) {
							Snackbar.show({
								text: getStr("loginTimeoutRetry") + e?.message,
								duration: Snackbar.LENGTH_SHORT,
							});
						} finally {
							setDataSource(null);
							setGenerating(false);
						}
					}}>
					<IconSend
						height={20}
						width={20}
						color={
							input.trim() === "" || generating ? colors.fontB3 : colors.primary
						}
					/>
				</TouchableOpacity>
			</View>
			<Modal visible={sidebarOpen} transparent>
				<Pressable
					style={{
						position: "absolute",
						end: 0,
						top: 0,
						width: "100%",
						height: "100%",
					}}
					onPress={() => toggleSidebar(false)}
				>
					<Animated.View
						style={{
							flex: 1,
							opacity: sidebarPosition.interpolate({
								inputRange: [-1, 0],
								outputRange: [0, 0.75],
							}),
							backgroundColor: colors.themeBackground,
						}}
					/>
				</Pressable>
				<Animated.View
					style={{
						position: "absolute",
						top: 0,
						transform: [{ translateX: sidebarPosition.interpolate({
							inputRange: [-1, 0],
							outputRange: [-0.62 * useWindowDimensions().width, 0],
						}) }],
						backgroundColor: colors.contentBackground,
						paddingHorizontal: 16,
						paddingTop: getStatusBarHeight(true) + 2,
						paddingBottom: insets.bottom,
						width: "62%",
						height: "100%",
					}}>
					<View
						style={{
							flex: 0,
							flexDirection: "row",
							alignItems: "center",
						}}>
						<TextInput
							value={searchKey}
							onChangeText={setSearchKey}
							style={{
								flex: 1,
								textAlignVertical: "center",
								fontSize: 14,
								marginVertical: 4,
								paddingVertical: 4,
								paddingHorizontal: 12,
								backgroundColor: colors.themeBackground,
								color: colors.text,
								borderColor: colors.themePurple,
								borderWidth: 1.5,
								borderRadius: 18,
							}}
							placeholder={getStr("search")}
							placeholderTextColor={colors.fontB3}
						/>
					</View>
					<Text style={{color: colors.fontB2, margin: 4, marginTop: 8}}>
						{getStr("deepseekLocalStorageNotice")}
					</Text>
					<SectionList
						style={{flex: 1, marginTop: 8}}
						sections={Object.entries(
							history.reduce((acc, item) => {
								const date = new Date(item.timestamp ?? 0).toLocaleDateString();
								if (!acc[date]) {
									acc[date] = [];
								}
								acc[date].push(item);
								return acc;
							}, {} as Record<string, Conversation[]>),
						)
							.sort(
								([dateA], [dateB]) =>
									new Date(dateB).getTime() - new Date(dateA).getTime(),
							)
							.map(([date, data]) => ({
								title: date,
								data,
							}))}
						renderItem={({item}) => (
							<Pressable
								style={{
									padding: 8,
									marginStart: 4,
									backgroundColor:
										deleteId === item.id
											? colors.statusWarningOpacity
											: item.timestamp === conversation.timestamp
											? colors.themeTransparentGrey
											: colors.contentBackground,
									borderRadius: 8,
								}}
								onPress={() => {
									setCurrentIndex(history.findIndex((c) => c.id === item.id));
									toggleSidebar(false);
								}}
								onLongPress={() => {
									setDeleteId(item.id);
									Alert.alert(
										getStr("delete"),
										getStr("deleteConversationConfirm"),
										[
											{
												text: getStr("cancel"),
												style: "cancel",
												onPress: () => {
													setDeleteId(null);
												},
											},
											{
												text: getStr("confirm"),
												onPress: () => {
													dispatch(deepseekDeleteConversation(item));
													setDeleteId(null);
													toggleSidebar(false);
												},
											},
										],
										{
											cancelable: true,
											onDismiss: () => {
												setDeleteId(null);
											},
										},
									);
								}}>
								<Text style={{color: colors.text}}>{item.title}</Text>
							</Pressable>
						)}
						renderSectionHeader={({section: {title}}) => (
							<Text
								style={{
									color: colors.fontB2,
									backgroundColor: colors.contentBackground,
									paddingVertical: 4,
								}}>
								{title}
							</Text>
						)}
						keyExtractor={(item) => item.id}
					/>
					<TouchableOpacity
						style={{
							paddingVertical: 12,
							marginTop: 8,
							borderRadius: 12,
							backgroundColor: colors.themeTransparentGrey,
						}}
						onPress={createConversation}>
						<Text style={{color: colors.text, textAlign: "center"}}>
							{getStr("newConversation")}
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={{
							paddingVertical: 12,
							marginTop: 8,
							borderRadius: 12,
							backgroundColor: colors.statusWarningOpacity,
						}}
						onPress={deleteAllHistory}>
						<Text style={{color: colors.statusWarning, textAlign: "center"}}>
							{getStr("delete") + getStr("all")}
						</Text>
					</TouchableOpacity>
				</Animated.View>
			</Modal>
		</KeyboardAvoidingView>
	);
};

const styles = themedStyles(({colors}) => ({
	capsule: {
		borderRadius: 16,
		paddingHorizontal: 10,
		paddingVertical: 3,
		marginHorizontal: 3,
		marginVertical: 6,
		backgroundColor: colors.themeTransparentGrey,
	},
}));
