import {
	FlatList,
	Modal,
	KeyboardAvoidingView,
	Platform,
	Text,
	TextInput,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import IconAdd from "../../assets/icons/IconAdd.tsx";
import IconHamburgerMenu from "../../assets/icons/IconHamburgerMenu.tsx";
import IconSend from "../../assets/icons/IconSend.tsx";
import EventSource from "react-native-sse";
import {v4 as uuidv4} from "uuid";
import Markdown from "react-native-markdown-display";
import { helper, State } from "../../redux/store.ts";
import { MADMODEL_AUTH_LOGIN_URL, MADMODEL_BASE_URL } from "@thu-info/lib/src/constants/strings.ts";
import { useDispatch, useSelector } from "react-redux";
import { configSet } from "../../redux/slices/config.ts";
import Snackbar from "react-native-snackbar";
import IconDeepSeek from "../../assets/icons/IconDeepSeek.tsx";
import IconDropdown from "../../assets/icons/IconDropdown.tsx";
import IconCheck from "../../assets/icons/IconCheck.tsx";
import {useHeaderHeight} from "@react-navigation/elements";
import {getStatusBarHeight} from "react-native-safearea-height";
import { deepseekUpdateHistory } from "../../redux/slices/deepseek.ts";
import { ChannelTag } from "@thu-info/lib/src/models/news/news.ts";
import themedStyles from "../../utils/themedStyles.ts";
import { DeepSeekTabProp } from "../../components/Root.tsx";

export interface Message {
	role: "system" | "user" | "assistant" | "tool";
	content: string;  // We currently do not support multi-modal.
}

export interface Conversation {
	id: string;
	title: string;
	messages: Message[];
}

const splitReasoning = (answer: string): [string, string] => {
	const beginTag = "<think>";
	const endTag = "</think>";
	if (answer.includes(beginTag) && answer.includes(endTag)) {
		const beginPos = answer.indexOf(beginTag);
		const endPos = answer.indexOf(endTag);
		return [answer.substring(beginPos + beginTag.length, endPos), answer.substring(endPos + endTag.length)];
	} else if (answer.includes(beginTag)) {
		const beginPos = answer.indexOf(beginTag);
		return [answer.substring(beginPos + beginTag.length), ""];
	} else {
		return ["", answer];
	}
};

const models = ["DeepSeek-R1-Distill-32B", "DeepSeek-R1-671B"];

const newConversation = (): Conversation => ({
	id: uuidv4(),
	title: getStr("newConversation"),
	messages: [],
});

export const DeepSeek = ({ route: { params } }: { route: DeepSeekTabProp }) => {
	const [input, setInput] = useState("");
	const [generating, setGenerating] = useState(false);
	const [open, setOpen] = useState(false);
	const [dataSource, setDataSource] = useState<ChannelTag | undefined>(undefined);
	const [searching, setSearching] = useState(false);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [model, setModel] = useState<string>(models[0]);
	const [conversation, setConversation] = useState<Conversation>(newConversation());
	const [searchKey, setSearchKey] = useState("");
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const {deepseekToken} = useSelector((s: State) => s.config);
	const {history} = useSelector((s: State) => s.deepseek);
	const dispatch = useDispatch();

	const inputRef = useRef<TextInput>(null);

	const style = styles(themeName);

	const headerHeight = useHeaderHeight();

	let statusText = "";
	if (searching) {
		statusText = getStr("searching");
	} else if (conversation.messages[conversation.messages.length - 1]?.content?.includes("</think>")) {
		statusText = getStr("reasoningDone");
	} else {
		statusText = getStr("reasoning");
	}

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

	const createConversation = () => {
		setConversation(prev => {
			if (prev.messages.length === 0) {
				Snackbar.show({text: getStr("alreadyLatestChat"), duration: Snackbar.LENGTH_SHORT});
			}
			return newConversation();
		});
		setSidebarOpen(false);
		inputRef.current?.focus();
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={{flex: 1, paddingTop: getStatusBarHeight(), flexDirection: "column"}}>
			<View style={{
				flexDirection: "row",
				height: 40,
				padding: 4,
				alignItems: "center",
			}}>
				<TouchableOpacity
					style={{flex: 0, alignItems: "center", justifyContent: "center", padding: 4}}
					onPress={() => {
						setSidebarOpen(true);
					}}>
					<IconHamburgerMenu height={24} width={24} />
				</TouchableOpacity>
				<View style={{flex: 1}}>
					{conversation.messages.length > 0 ? (<Text style={{ color: colors.text, textAlign: "center"}}>
						{conversation.title}
					</Text>) : (<TouchableOpacity style={{flexDirection: "row", alignItems: "center", justifyContent: "center"}} onPress={() => setOpen(true)}>
						<Text
							style={{color: open ? colors.primary : colors.fontB2}}>
							{model}
						</Text>
						<View style={{marginLeft: 6}}>
							<IconDropdown
								width={6}
								height={4}
								color={open ? colors.primary : colors.fontB2}
							/>
						</View>
					</TouchableOpacity>)}
				</View>
				<TouchableOpacity
					style={{flex: 0, alignItems: "center", justifyContent: "center", padding: 4}}
					onPress={createConversation}>
					<IconAdd height={24} width={24} />
				</TouchableOpacity>
				<Modal visible={open} transparent>
					<TouchableOpacity
						style={{
							width: "100%",
							height: "100%",
						}}
						onPress={() => setOpen(false)}>
						<View
							style={{
								position: "absolute",
								backgroundColor: colors.text,
								opacity: 0.3,
								width: "100%",
								top: headerHeight - getStatusBarHeight() + 32,
								bottom: 0,
							}}
						/>
						<View
							style={{
								position: "absolute",
								backgroundColor: colors.contentBackground,
								width: "100%",
								top: headerHeight - getStatusBarHeight() + 32,
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
												paddingHorizontal: 16,
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
			<FlatList style={{margin: 16}} data={conversation.messages} renderItem={({item}) => {
				if (item.role === "user") {
					return <View style={{flexDirection: "row", justifyContent: "flex-end"}}><View style={{
						backgroundColor: colors.themeTransparentPurple,
						paddingVertical: 8,
						paddingHorizontal: 4,
						marginLeft: 24,
						marginVertical: 4,
					}}>
						<Text style={{color: colors.text}}>{item.content}</Text>
					</View></View>;
				} else if (item.role === "assistant") {
					const [reasoning, answer] = splitReasoning(item.content);
					return <View style={{
						flexDirection: "row",
						marginVertical: 4,
						marginRight: 4,
					}}>
						<View style={{height: 24, width: 24, alignItems: "center", justifyContent: "center", flex: 0}}>
							<IconDeepSeek width={16} height={16} />
						</View>
						<View style={{flex: 1}}>
							<Text style={{color: colors.fontB3, marginVertical: 4}}>{statusText}</Text>
							{reasoning.trim().length > 0 && <View style={{flexDirection: "row"}}>
								<View style={{height: "100%", width: 2, backgroundColor: colors.fontB3}}/>
								<Text style={{color: colors.fontB3, marginLeft: 8}}>{reasoning}</Text>
							</View>}
							{answer.trim().length > 0 && <Markdown>{answer}</Markdown>}
						</View>
					</View>;
				} else {
					return null;
				}
			}}
				ListEmptyComponent={<View><Text style={{color: colors.text, fontSize: 24}}>deepseekWelcomeText</Text></View>} />
			<View style={{
				flex: 0,
				flexDirection: "row",
				padding: 4,
			}}>
				<TouchableOpacity onPress={() => setDataSource((prev) => prev === "LM_XJ_XSSQDT" ? undefined : "LM_XJ_XSSQDT")} style={[style.capsule, dataSource === "LM_XJ_XSSQDT" ? {backgroundColor: colors.themeTransparentPurple} : {}]}>
					<Text style={{color: colors.text}}>{getStr("LM_XJ_XSSQDT")}</Text>
				</TouchableOpacity>
				<TouchableOpacity onPress={() => setDataSource((prev) => prev === "LM_BYJYXX" ? undefined : "LM_BYJYXX")} style={[style.capsule, dataSource === "LM_BYJYXX" ? {backgroundColor: colors.themeTransparentPurple} : {}]}>
					<Text style={{color: colors.text}}>{getStr("LM_BYJYXX")}</Text>
				</TouchableOpacity>
				<TouchableOpacity onPress={() => setDataSource((prev) => prev === "LM_JWGG" ? undefined : "LM_JWGG")} style={[style.capsule, dataSource === "LM_JWGG" ? {backgroundColor: colors.themeTransparentPurple} : {}]}>
					<Text style={{color: colors.text}}>{getStr("LM_JWGG")}</Text>
				</TouchableOpacity>
			</View>
			<View style={{
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
						padding: 12,
						paddingRight: 36,
						height: 80,
						backgroundColor: colors.themeBackground,
						color: colors.text,
						borderColor: colors.themePurple,
						borderWidth: 1.5,
					}}
					textAlignVertical="top"
					multiline={true}
					placeholder={getStr("askDeepSeekPrompt")}
					placeholderTextColor={colors.fontB3}
				/>
				<TouchableOpacity
					style={{position: "absolute", right: 12, bottom: 12}}
					disabled={input.trim() === "" || generating}
					onPress={async () => {
						if (input.trim() === "" || generating) {
							return;
						}
						setConversation((prev) => {
							const next = {
								...prev,
								messages: prev.messages.concat({
									role: "user",
									content: input.trim(),
								}),
							};
							dispatch(deepseekUpdateHistory(next));
							return next;
						});
						setInput("");
						setGenerating(true);
						try {
							setConversation((prev) => ({
								...prev,
								messages: prev.messages.concat({
									role: "assistant",
									content: "",
								}),
							}));
							let prompt = input.trim();
							if (dataSource) {
								setSearching(true);
								const newsList = await helper.getNewsList(1, 20, dataSource);
								prompt = `请根据下面新闻标题回答问题：

新闻标题：

${newsList.map((item, index) => `${index + 1}. ${item.name}`).join("\n")}

问题：
` + prompt;
								setSearching(false);
							}
							const es = new EventSource(
								`${MADMODEL_BASE_URL}/v1/chat/completions`,
								{
									method: "POST",
									headers: {
										Authorization: `Bearer ${deepseekToken}`,
										"Content-Type": "application/json",
									},
									body: JSON.stringify({
										model,
										messages: [
											...conversation.messages.map((message) => message.role === "assistant" ? {...message, content: splitReasoning(message.content)[1]} : message),
											{
												role: "user",
												content: prompt,
											},
										],
										temperature: 0.6,
										repetition_penalty: 1.2,
										stream: true,
									}),
									pollingInterval: 0,
								}
							);
							await new Promise<void>((resolve, reject) => {
								es.addEventListener("message", (event) => {
									if (event.data) {
										if (event.data.trim() === "[DONE]") {
											resolve();
										} else {
											const value = JSON.parse(event.data);
											if (value.errorMessage) {
												setConversation((prev) => ({
													...prev,
													messages: prev.messages.slice(0, prev.messages.length - 1).concat({
														role: "assistant",
														content: prev.messages[prev.messages.length - 1].content + value.errorMessage,
													}),
												}));
												resolve();
												return;
											}
											const choice = value.choices[0];
											if (choice?.delta == null) {
												return;
											}
											const delta = choice.delta;
											if (delta.content != null) {
												setConversation((prev) => ({
													...prev,
													messages: prev.messages.slice(0, prev.messages.length - 1).concat({
														role: "assistant",
														content: prev.messages[prev.messages.length - 1].content + delta.content,
													}),
												}));
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
						} catch (e: any) {
							Snackbar.show({
								text: getStr("loginTimeoutRetry") + e?.message,
								duration: Snackbar.LENGTH_SHORT,
							});
						} finally {
							setDataSource(undefined);
							setGenerating(false);
							setConversation((prev) => {
								dispatch(deepseekUpdateHistory(prev));
								return prev;
							});
						}
					}}>
					<IconSend height={18} width={18} color={input.trim() === "" || generating ? colors.themeGrey : colors.primary} />
				</TouchableOpacity>
			</View>
			<Modal visible={sidebarOpen} transparent>
				<TouchableOpacity
					style={{
						width: "100%",
						height: "100%",
					}}
					onPress={() => setSidebarOpen(false)}>
					<View
						style={{
							position: "absolute",
							backgroundColor: colors.text,
							opacity: 0.3,
							width: "100%",
							height: "100%",
						}}
					/>
					<View
						style={{
							position: "absolute",
							backgroundColor: colors.contentBackground,
							paddingHorizontal: 18,
							width: "62%",
							height: "100%",
						}}>
						<TouchableOpacity
							style={{alignSelf: "flex-end", alignItems: "center", justifyContent: "center", flex: 0, padding: 4, marginVertical: 4}}
							onPress={createConversation}>
							<IconAdd height={24} width={24} />
						</TouchableOpacity>
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
									paddingHorizontal: 18,
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
						<Text style={{color: colors.fontB2, margin: 4, marginTop: 8}}>{getStr("deepseekLocalStorageNotice")}</Text>
						<FlatList
							style={{flex: 1, marginTop: 8}}
							data={history}
							renderItem={({item}) => (<TouchableOpacity
								style={{
									padding: 4,
								}}
								onPress={() => {
									setConversation(item);
								}}
							>
								<Text style={{color: colors.text}}>{item.title}</Text>
							</TouchableOpacity>)}
							keyExtractor={(item) => item.id}
						/>
					</View>
				</TouchableOpacity>
			</Modal>
		</KeyboardAvoidingView>
	);
};

const styles = themedStyles(({colors}) => ({
	capsule: {
		borderRadius: 16,
		paddingHorizontal: 16,
		paddingVertical: 4,
		margin: 8,
		borderWidth: 1,
		borderColor: colors.text,
		backgroundColor: colors.themeBackground,
	},
}));
