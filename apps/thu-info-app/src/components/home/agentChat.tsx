import {useMemo, useState, type ReactNode} from "react";
import {
	Alert,
	Linking,
	Pressable,
	StyleSheet,
	Text,
	View,
	useWindowDimensions,
} from "react-native";
import Markdown from "react-native-markdown-display";
import Clipboard from "@react-native-clipboard/clipboard";
import {Snackbar} from "react-native-snackbar";
import type {ColorTheme} from "../../assets/themes/themes";
import IconDeepSeek from "../../assets/icons/IconDeepSeek";
import IconCopy from "../../assets/icons/IconCopy";
import IconDown from "../../assets/icons/IconDown";
import IconCalendar from "../../assets/icons/IconCalendar";
import IconNewsTab from "../../assets/icons/IconNewsTab";
import IconRight from "../../assets/icons/IconRight";
import {getStr} from "../../utils/i18n";
import {scaledLineHeight} from "../../utils/scaledText";
import {fontSize, radius, spacing} from "../subpage/tokens";
import {agentText, turnContent, type AgentTurn} from "./agentChatPresentation";

export const AGENT_CHAT_MAX_WIDTH = 760;

export const AgentAction = ({
	label,
	onPress,
	disabled = false,
	icon,
	primary = false,
	colors,
}: {
	label: string;
	onPress: () => void;
	disabled?: boolean;
	icon?: ReactNode;
	primary?: boolean;
	colors: ColorTheme;
}) => {
	const {s} = useMessageStyles();
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{disabled}}
			disabled={disabled}
			onPress={onPress}
			style={({pressed}) => [
				s.action,
				{
					backgroundColor: primary
						? colors.primaryLight
						: pressed
							? colors.themeTransparentGrey
							: colors.transparent,
					opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
				},
			]}>
			{icon}
			<Text
				style={[s.actionLabel, {color: primary ? "#FFFFFF" : colors.fontB2}]}>
				{label}
			</Text>
		</Pressable>
	);
};

export const AgentMessageTurn = ({
	turn,
	colors,
	bubbleMessage,
	active,
	onDocument,
	onError,
}: {
	turn: AgentTurn;
	colors: ColorTheme;
	bubbleMessage: boolean;
	active: boolean;
	onDocument: (route: string) => void;
	onError: (message: string) => void;
}) => {
	const {s, fontScale} = useMessageStyles();
	const [expanded, setExpanded] = useState(false);
	const {answer, steps} = turnContent(turn);
	const copy = () => {
		Clipboard.setString(answer);
		Snackbar.show({text: getStr("copied"), duration: Snackbar.LENGTH_SHORT});
	};
	if (turn.role === "user") {
		return (
			<View style={s.userRow}>
				<Pressable
					onLongPress={copy}
					style={[
						s.userBubble,
						{
							backgroundColor: colors.themeTransparentPurple,
						},
					]}>
					<Text selectable style={[s.messageText, {color: colors.fontB0}]}>
						{answer}
					</Text>
				</Pressable>
			</View>
		);
	}
	const documents = turn.messages.flatMap((message) => message.documents ?? []);
	return (
		<View style={s.assistantTurn}>
			{!!steps.length && (
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={agentText("Thought process", "思考过程")}
					accessibilityState={{expanded}}
					onPress={() => setExpanded(!expanded)}
					style={({pressed}) => [
						s.thinkingButton,
						{opacity: pressed ? 0.6 : 1},
					]}>
					<Text style={[s.caption, {color: colors.fontB2}]}>
						{active
							? agentText("Thinking", "思考中")
							: agentText("Thought process", "思考过程")}
						{` · ${steps.length}`}
					</Text>
					<View style={{transform: [{rotate: expanded ? "180deg" : "0deg"}]}}>
						<IconDown width={16} height={16} />
					</View>
				</Pressable>
			)}
			{expanded && (
				<View style={[s.thinkingDetails, {borderColor: colors.inputBorder}]}>
					{steps.map((step, index) => (
						<View key={step.id} style={s.thinkingStep}>
							<Text style={[s.caption, {color: colors.themePurple}]}>
								{agentText("Step", "步骤")} {index + 1}
							</Text>
							<Text selectable style={[s.detailText, {color: colors.fontB2}]}>
								{step.text}
							</Text>
						</View>
					))}
				</View>
			)}
			{!!answer && (
				<View
					style={
						bubbleMessage
							? [s.answerBubble, {backgroundColor: colors.contentBackground}]
							: undefined
					}>
					<Markdown
						rules={{image: () => null}}
						style={{
							body: {
								color: colors.fontB0,
								fontSize: 16,
								lineHeight: scaledLineHeight(24, fontScale),
							},
							paragraph: {marginTop: 0, marginBottom: spacing.sm},
							heading1: {
								fontSize: 20,
								lineHeight: scaledLineHeight(32, fontScale),
								fontWeight: "600",
								marginTop: 20,
								marginBottom: 10,
							},
							heading2: {
								fontSize: 18,
								lineHeight: scaledLineHeight(29, fontScale),
								fontWeight: "600",
								marginTop: 18,
								marginBottom: 8,
							},
							heading3: {
								fontSize: 18,
								lineHeight: scaledLineHeight(26, fontScale),
								fontWeight: "600",
								marginTop: 14,
								marginBottom: 6,
							},
							link: {color: colors.themePurple},
							code_inline: {
								color: colors.fontB1,
								backgroundColor: colors.themeTransparentGrey,
								borderWidth: 0,
							},
							code_block: {
								color: colors.fontB1,
								backgroundColor: colors.themeTransparentGrey,
								borderWidth: 0,
								padding: 14,
								borderRadius: radius.control,
							},
							fence: {
								color: colors.fontB1,
								backgroundColor: colors.themeTransparentGrey,
								borderWidth: 0,
								padding: 14,
								borderRadius: radius.control,
							},
							blockquote: {
								backgroundColor: colors.themeTransparentGrey,
								borderColor: colors.themePurple,
								borderLeftWidth: 1,
							},
							hr: {
								backgroundColor: colors.inputBorder,
								height: StyleSheet.hairlineWidth,
							},
							table: {borderColor: colors.inputBorder, borderRadius: 8},
							tr: {borderColor: colors.inputBorder},
						}}
						onLinkPress={(url) => {
							if (/^https?:\/\//i.test(url)) {
								Alert.alert(agentText("Open source", "打开来源"), url, [
									{text: getStr("cancel"), style: "cancel"},
									{
										text: getStr("confirm"),
										onPress: () => {
											Linking.openURL(url).catch((error) =>
												onError(String(error)),
											);
										},
									},
								]);
							}
							return false;
						}}>
						{answer}
					</Markdown>
				</View>
			)}
			{documents.map((document, index) => (
				<AgentAction
					key={`${document.tool}-${index}`}
					colors={colors}
					label={agentText("Open document", "打开文档")}
					onPress={() => onDocument(document.route)}
				/>
			))}
			{!!answer && !active && (
				<View style={s.copyRow}>
					<AgentAction
						colors={colors}
						label={agentText("Copy", "复制")}
						onPress={copy}
						icon={<IconCopy width={16} height={16} color={colors.fontB2} />}
					/>
				</View>
			)}
		</View>
	);
};

export const AgentWelcome = ({
	colors,
	disabled,
	onSelect,
}: {
	colors: ColorTheme;
	disabled: boolean;
	onSelect: (prompt: string) => void;
}) => {
	const {s} = useMessageStyles();
	const suggestions = [
		{
			title: agentText("Plan my day", "看看今天的日程"),
			prompt: agentText(
				"Show my classes and schedules for today.",
				"帮我看看今天的课表和日程。",
			),
			icon: <IconCalendar width={22} height={22} />,
		},
		{
			title: agentText("Catch up on campus", "读一读校园新闻"),
			prompt: agentText(
				"Show me today's campus news.",
				"帮我看看今天的校园新闻。",
			),
			icon: <IconNewsTab size={22} active={false} />,
		},
		{
			title: agentText("Explore what I can do", "你能帮我做什么"),
			prompt: agentText("What can you help me with?", "你能帮我做什么？"),
			icon: <IconDeepSeek width={22} height={22} />,
		},
	];
	return (
		<View style={s.welcome}>
			<View style={s.welcomeIntro}>
				<IconDeepSeek width={28} height={28} />
				<Text
					accessibilityRole="header"
					style={[s.welcomeTitle, {color: colors.fontB0}]}>
					{agentText("What can I help with?", "今天想做什么？")}
				</Text>
				<Text style={[s.welcomeDescription, {color: colors.fontB2}]}>
					{agentText(
						"Find campus information and make room for your day.",
						"查校园信息，安排接下来的日程。",
					)}
				</Text>
			</View>
			<View style={s.suggestions}>
				{suggestions.map(({title, prompt, icon}, index) => (
					<Pressable
						key={title}
						accessibilityRole="button"
						accessibilityLabel={title}
						accessibilityState={{disabled}}
						accessibilityHint={agentText(
							"Adds this question to the message field",
							"将问题填入输入框",
						)}
						disabled={disabled}
						onPress={() => onSelect(prompt)}
						style={({pressed}) => [
							s.suggestion,
							{
								backgroundColor: pressed
									? colors.themeTransparentGrey
									: colors.transparent,
								borderTopWidth: index ? StyleSheet.hairlineWidth : 0,
								borderTopColor: colors.themeGrey,
								opacity: disabled ? 0.4 : 1,
							},
						]}>
						{icon}
						<Text style={[s.suggestionLabel, {color: colors.fontB1}]}>
							{title}
						</Text>
						<IconRight width={18} height={18} />
					</Pressable>
				))}
			</View>
		</View>
	);
};

export const agentChatStyles = (fontScale: number) =>
	StyleSheet.create({
		column: {
			width: "100%",
			maxWidth: AGENT_CHAT_MAX_WIDTH,
			alignSelf: "center",
		},
		header: {
			flexDirection: "row",
			alignItems: "center",
			paddingHorizontal: 12,
			paddingVertical: 6,
			gap: 8,
		},
		headerTitle: {fontSize: fontSize.title, fontWeight: "600"},
		headerSubtitle: {fontSize: fontSize.caption, marginTop: spacing.xs},
		iconButton: {
			minWidth: 48,
			minHeight: 48,
			alignItems: "center",
			justifyContent: "center",
			borderRadius: radius.control,
		},
		listContent: {
			paddingHorizontal: spacing.md,
			paddingTop: spacing.md,
			paddingBottom: spacing.md,
			gap: spacing.md,
			flexGrow: 1,
			width: "100%",
			maxWidth: AGENT_CHAT_MAX_WIDTH,
			alignSelf: "center",
		},
		composer: {
			paddingHorizontal: spacing.md,
			paddingTop: spacing.sm,
			paddingBottom: spacing.sm,
		},
		composerField: {
			flexDirection: "row",
			alignItems: "flex-end",
			borderRadius: radius.control,
			padding: spacing.xs,
			borderWidth: 1,
		},
		sendButton: {
			minWidth: 48,
			minHeight: 48,
			alignItems: "center",
			justifyContent: "center",
			borderRadius: radius.control,
		},
		input: {
			flex: 1,
			minWidth: 0,
			minHeight: 48,
			maxHeight: 140,
			paddingHorizontal: spacing.sm,
			paddingVertical: spacing.md,
			fontSize: 15,
			lineHeight: scaledLineHeight(22, fontScale),
			textAlignVertical: "top",
		},
		progress: {
			flexDirection: "row",
			alignItems: "center",
			gap: 10,
			paddingHorizontal: 8,
			paddingBottom: 10,
			minHeight: 32,
		},
		progressText: {
			flex: 1,
			fontSize: 13,
			lineHeight: scaledLineHeight(19, fontScale),
		},
		caption: {fontSize: 12, lineHeight: scaledLineHeight(18, fontScale)},
		panel: {padding: spacing.lg, borderRadius: radius.card, gap: spacing.sm},
		panelTitle: {
			fontSize: 16,
			fontWeight: "600",
			lineHeight: scaledLineHeight(24, fontScale),
		},
		panelBody: {fontSize: 15, lineHeight: scaledLineHeight(23, fontScale)},
		actionRow: {
			flexDirection: "row",
			flexWrap: "wrap",
			gap: 8,
			alignItems: "center",
		},
		footer: {gap: spacing.md, paddingBottom: spacing.md},
		modalHeader: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			gap: 12,
			paddingHorizontal: spacing.md,
			paddingBottom: 12,
		},
		modalTitle: {fontSize: fontSize.title, fontWeight: "600", flex: 1},
		search: {
			flexDirection: "row",
			alignItems: "center",
			gap: 12,
			marginHorizontal: spacing.md,
			paddingHorizontal: 16,
			borderRadius: radius.control,
			marginBottom: spacing.md,
			borderWidth: 1,
		},
		searchInput: {flex: 1, minWidth: 0, minHeight: 52, fontSize: 16},
		historyRow: {
			flexDirection: "row",
			alignItems: "center",
			marginHorizontal: 12,
			paddingHorizontal: 8,
			borderBottomWidth: StyleSheet.hairlineWidth,
		},
		historyEntry: {
			flex: 1,
			minWidth: 0,
			paddingVertical: 16,
			paddingHorizontal: 10,
			gap: 6,
		},
		historyTitle: {
			fontSize: 16,
			lineHeight: scaledLineHeight(23, fontScale),
			fontWeight: "500",
		},
		centered: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
			padding: 32,
			gap: 16,
		},
	});

const messageStyles = (fontScale: number) =>
	StyleSheet.create({
		action: {
			minHeight: 48,
			paddingHorizontal: 12,
			paddingVertical: 10,
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "center",
			borderRadius: radius.control,
			gap: spacing.sm,
			flexShrink: 1,
		},
		actionLabel: {
			fontSize: 14,
			lineHeight: scaledLineHeight(21, fontScale),
			fontWeight: "500",
			flexShrink: 1,
		},
		userRow: {alignItems: "flex-end", paddingLeft: 24},
		userBubble: {
			maxWidth: "92%",
			paddingHorizontal: spacing.md,
			paddingVertical: spacing.sm,
			borderRadius: radius.control,
		},
		messageText: {fontSize: 16, lineHeight: scaledLineHeight(25, fontScale)},
		assistantTurn: {gap: spacing.xs},
		answerBubble: {
			padding: spacing.md,
			borderRadius: radius.control,
		},
		thinkingButton: {
			flexDirection: "row",
			alignItems: "center",
			minHeight: 48,
			gap: 4,
			paddingHorizontal: spacing.sm,
			alignSelf: "flex-start",
		},
		caption: {fontSize: 12, lineHeight: scaledLineHeight(18, fontScale)},
		thinkingDetails: {
			borderLeftWidth: StyleSheet.hairlineWidth,
			paddingLeft: spacing.md,
			paddingVertical: spacing.sm,
			marginBottom: spacing.sm,
			gap: spacing.md,
		},
		thinkingStep: {gap: 4},
		detailText: {fontSize: 14, lineHeight: scaledLineHeight(23, fontScale)},
		copyRow: {flexDirection: "row"},
		welcome: {paddingTop: spacing.lg, gap: spacing.lg},
		welcomeIntro: {
			alignItems: "center",
			paddingHorizontal: spacing.lg,
			gap: spacing.sm,
		},
		welcomeTitle: {
			fontSize: fontSize.title,
			lineHeight: scaledLineHeight(26, fontScale),
			fontWeight: "600",
			textAlign: "center",
		},
		welcomeDescription: {
			fontSize: fontSize.caption,
			lineHeight: scaledLineHeight(20, fontScale),
			textAlign: "center",
		},
		suggestions: {paddingHorizontal: spacing.md},
		suggestion: {
			flexDirection: "row",
			alignItems: "center",
			gap: spacing.md,
			minHeight: 52,
			paddingVertical: 12,
		},
		suggestionLabel: {
			fontSize: 15,
			lineHeight: scaledLineHeight(23, fontScale),
			flex: 1,
		},
	});

const useMessageStyles = () => {
	const {fontScale} = useWindowDimensions();
	const s = useMemo(() => messageStyles(fontScale), [fontScale]);
	return {s, fontScale};
};
