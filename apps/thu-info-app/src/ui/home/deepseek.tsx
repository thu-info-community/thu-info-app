import {
	FlatList,
	KeyboardAvoidingView,
	Platform,
	Text,
	TextInput,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import { useEffect, useState } from "react";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import IconSearch from "../../assets/icons/IconSearch.tsx";
import EventSource from "react-native-sse";
import { helper, State } from "../../redux/store.ts";
import { MADMODEL_AUTH_LOGIN_URL, MADMODEL_BASE_URL } from "@thu-info/lib/src/constants/strings.ts";
import { useDispatch, useSelector } from "react-redux";
import { configSet } from "../../redux/slices/config.ts";
import Snackbar from "react-native-snackbar";

interface Message {
	role: "system" | "user" | "assistant" | "tool";
	content: string;  // We currently do not support multi-modal.
}

export const DeepSeek = () => {
	const [input, setInput] = useState("");
	const [generating, setGenerating] = useState(false);
	const [messages, setMessages] = useState<Message[]>([]);
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const {deepseekToken} = useSelector((s: State) => s.config);
	const dispatch = useDispatch();

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
					console.info(success);
					if (!success) {
						helper.getMadModelToken().then((token) => {
							dispatch(configSet({key: "deepseekToken", value: token}));
						});
					}
				});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={{flex: 1, flexDirection: "column"}}>
			<FlatList data={messages} renderItem={({item}) => {
				return <View><Text>{item.role}: {item.content}</Text></View>;
			}} />
			<View style={{
				flex: 0,
				flexDirection: "row",
				margin: 12,
				alignItems: "center",
			}}>
				<TextInput
					value={input}
					onChangeText={setInput}
					style={{
						flex: 1,
						textAlignVertical: "center",
						fontSize: 14,
						paddingVertical: 4,
						paddingLeft: 12,
						paddingRight: 36,
						backgroundColor: colors.themeBackground,
						color: colors.text,
						borderColor: colors.themePurple,
						borderWidth: 1.5,
						borderRadius: 20,
					}}
					placeholder={getStr("askDeepSeekPrompt")}
					placeholderTextColor={colors.fontB3}
				/>
				<TouchableOpacity
					style={{position: "absolute", right: 12}}
					disabled={input.trim() === "" || generating}
					onPress={async () => {
						if (input.trim() === "" || generating) {
							return;
						}
						setMessages((prev) => prev.concat({
							role: "user",
							content: input.trim(),
						}));
						setInput("");
						setGenerating(true);
						try {
							setMessages((prev) => prev.concat({
								role: "assistant",
								content: "",
							}));
							const es = new EventSource(
								`${MADMODEL_BASE_URL}/v1/chat/completions`,
								{
									method: "POST",
									headers: {
										Authorization: `Bearer ${deepseekToken}`,
										"Content-Type": "application/json",
									},
									body: JSON.stringify({
										model: "DeepSeek-R1-Distill-32B",
										messages: [
											{
												role: "user",
												content: input.trim(),
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
											const choice = value.choices[0];
											if (choice?.delta == null) {
												return;
											}
											const delta = choice.delta;
											if (delta.content != null) {
												setMessages((prev) => prev.slice(0, prev.length - 1).concat({
													role: "assistant",
													content: prev[prev.length - 1].content + delta.content,
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
							setGenerating(false);
						}
					}}>
					<IconSearch height={18} width={18} />
				</TouchableOpacity>
			</View>
		</KeyboardAvoidingView>
	);
};
