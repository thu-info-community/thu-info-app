import {
	ActivityIndicator,
	Pressable,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import Markdown from "react-native-markdown-display";
import {Snackbar} from "react-native-snackbar";
import themes from "../../assets/themes/themes";
import IconDeepSeek from "../../assets/icons/IconDeepSeek";
import IconCopy from "../../assets/icons/IconCopy";
import IconRefresh from "../../assets/icons/IconRefresh";
import {getStr} from "../../utils/i18n";
import {addUsageStat, FunctionType} from "../../utils/webApi";
import type {Message} from "../../ui/home/deepseek";

export const splitReasoningAndStatus = (
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

export const systemErrorMessage = "服务器繁忙,请稍后再试";

type DeepSeekColors = ReturnType<typeof themes>["colors"];
interface DeepSeekMessageProps {
	item: Message;
	colors: DeepSeekColors;
	isLast: boolean;
	searching: boolean;
	generating: boolean;
	bubbleMessage?: boolean;
	onRefresh: () => void;
}

const DeepSeekUserMessage = ({
	item,
	colors,
}: Pick<DeepSeekMessageProps, "item" | "colors">) => (
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
					<Text style={{color: colors.text}}>{item.content}</Text>
				</Pressable>
			</View>
		</View>
	</View>
);

const DeepSeekAnswerContent = ({
	colors,
	reasoning,
	answer,
	bubbleMessage,
}: {
	colors: DeepSeekColors;
	reasoning: string;
	answer: string;
	bubbleMessage?: boolean;
}) => (
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
);

const DeepSeekMessageActions = ({
	colors,
	answer,
	isLast,
	generating,
	onRefresh,
}: Pick<
	DeepSeekMessageProps,
	"colors" | "isLast" | "generating" | "onRefresh"
> & {answer: string}) => (
	<View
		style={[
			{flexDirection: "row"},
			isLast && generating ? {display: "none"} : {},
		]}>
		<TouchableOpacity
			style={{
				padding: 2,
			}}
			disabled={generating}
			onPress={() => {
				addUsageStat(FunctionType.DeepSeekCopy);
				Clipboard.setString(answer);
				Snackbar.show({
					text: getStr("copied"),
					duration: Snackbar.LENGTH_SHORT,
				});
			}}>
			<IconCopy height={18} width={18} color={colors.fontB3} />
		</TouchableOpacity>
		{isLast && (
			<TouchableOpacity
				style={{
					padding: 2,
				}}
				disabled={generating}
				onPress={() => {
					onRefresh();
				}}>
				<IconRefresh height={18} width={18} color={colors.fontB3} />
			</TouchableOpacity>
		)}
	</View>
);

const DeepSeekAssistantMessage = ({
	item,
	colors,
	isLast,
	searching,
	generating,
	bubbleMessage,
	onRefresh,
}: DeepSeekMessageProps) => {
	const [reasoning, answer, statusText] = splitReasoningAndStatus(item.content);
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
					{searching && isLast ? getStr("searching") : getStr(statusText)}
					&nbsp;&nbsp;
					{new Date(item.timestamp ?? 0).toLocaleString([], {
						month: "numeric",
						day: "numeric",
						hour: "2-digit",
						minute: "2-digit",
					})}
				</Text>
				{item.content.length !== 0 ? (
					<DeepSeekAnswerContent
						colors={colors}
						reasoning={reasoning}
						answer={answer}
						bubbleMessage={bubbleMessage}
					/>
				) : (
					<ActivityIndicator
						size="small"
						color={colors.themeTransparentPurple}
					/>
				)}
				{(!isLast || !generating) && item.content !== systemErrorMessage && (
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
				<DeepSeekMessageActions
					colors={colors}
					answer={answer}
					isLast={isLast}
					generating={generating}
					onRefresh={onRefresh}
				/>
			</View>
		</View>
	);
};

export const DeepSeekMessage = (props: DeepSeekMessageProps) => {
	switch (props.item.role) {
		case "user":
			return <DeepSeekUserMessage item={props.item} colors={props.colors} />;
		case "assistant":
			return <DeepSeekAssistantMessage {...props} />;
		default:
			return null;
	}
};
