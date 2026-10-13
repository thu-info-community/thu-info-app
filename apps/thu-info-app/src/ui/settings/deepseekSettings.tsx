import {Fragment, useCallback, useEffect, useRef, useState} from "react";
import {
	Alert,
	Pressable,
	Switch,
	Text,
	useColorScheme,
	View,
} from "react-native";
import {useDispatch, useSelector} from "react-redux";
import themes from "../../assets/themes/themes";
import IconCheck from "../../assets/icons/IconCheck";
import {agentService} from "../../agent/service";
import {campusModel, type ThinkingLevel} from "../../agent/types";
import {agentText} from "../../components/home/agentChatPresentation";
import {AdaptiveRow, useFontScale} from "../../components/subpage/adaptive";
import {SubPageScreen} from "../../components/subpage/containers";
import {Separator} from "../../components/subpage/rows";
import {fontSize, spacing} from "../../components/subpage/tokens";
import {RoundedView} from "../../components/views";
import {configSet} from "../../redux/slices/config";
import {deepseekClear} from "../../redux/slices/deepseek";
import {currState, type State} from "../../redux/store";
import {getStr} from "../../utils/i18n";
import themedStyles from "../../utils/themedStyles";

type StorageUsage = {account: string} & (
	{status: "loading" | "error"} | {status: "ready"; bytes: number}
);
type ClearKind = "details" | "all";

const thinkingLabel = (level: ThinkingLevel) =>
	({
		default: agentText("Model default", "模型默认"),
		off: agentText("Off", "关闭"),
		low: agentText("Low", "低强度"),
		high: agentText("High", "高强度"),
		max: agentText("Maximum", "最高强度"),
	})[level];

export const DeepSeekSettingsScreen = () => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	const {colors} = themes(themeName);
	const {isLargeText} = useFontScale();
	const {bubbleMessage, agentThinking} = useSelector((s: State) => s.config);
	const account = useSelector((s: State) => s.auth.userId);
	const dispatch = useDispatch();
	const [usage, setUsage] = useState<StorageUsage>();
	const [operation, setOperation] = useState<{
		account: string;
		kind: ClearKind;
	} | null>(null);
	const requestId = useRef(0);
	const mounted = useRef(false);
	const clearing = useRef(false);

	const refresh = useCallback(async () => {
		const request = ++requestId.current;
		if (!account) {
			setUsage(undefined);
			return;
		}
		setUsage({account, status: "loading"});
		const isCurrent = () =>
			mounted.current &&
			request === requestId.current &&
			currState().auth.userId === account;
		try {
			const bytes = await agentService.forAccount(account).usage();
			if (isCurrent()) setUsage({account, status: "ready", bytes});
		} catch {
			if (isCurrent()) setUsage({account, status: "error"});
		}
	}, [account]);

	useEffect(() => {
		mounted.current = true;
		refresh();
		return () => {
			mounted.current = false;
		};
	}, [refresh]);

	const clear = (kind: ClearKind) => {
		if (!account || clearing.current || currState().auth.userId !== account) {
			return;
		}
		Alert.alert(
			getStr("confirm"),
			kind === "all"
				? getStr("deleteAllHistoryConfirm")
				: agentText(
						"Remove reasoning, tool detail and resumable model context. Conversation text and action receipts are kept. Pending approvals will be invalidated.",
						"清除思考内容、工具详情和模型上下文，保留对话文本及操作记录。待确认的操作将失效。",
					),
			[
				{text: getStr("cancel"), style: "cancel"},
				{
					text: getStr("confirm"),
					style: "destructive",
					onPress: async () => {
						// A confirmation can outlive this screen or its signed-in account.
						if (
							!mounted.current ||
							clearing.current ||
							currState().auth.userId !== account
						) {
							return;
						}
						clearing.current = true;
						setOperation({account, kind});
						try {
							if (kind === "all") {
								await agentService.clear(account);
								if (currState().auth.userId === account) {
									dispatch(deepseekClear());
								}
							} else {
								await agentService.clearDetails();
							}
							if (mounted.current && currState().auth.userId === account) {
								await refresh();
							}
						} catch (error) {
							if (mounted.current && currState().auth.userId === account) {
								Alert.alert(
									agentText("Couldn't clear conversations", "清理失败"),
									String(error),
								);
							}
						} finally {
							clearing.current = false;
							if (mounted.current) setOperation(null);
						}
					},
				},
			],
		);
	};

	const currentUsage = usage?.account === account ? usage : undefined;
	const bytes =
		currentUsage?.status === "ready" ? currentUsage.bytes : undefined;
	const usageText = !account
		? "—"
		: bytes !== undefined
			? `${(bytes / 1024 / 1024).toFixed(1)} MiB`
			: currentUsage?.status === "error"
				? agentText("Couldn't load", "读取失败")
				: agentText("Loading…", "正在读取…");
	const actions = [
		{
			kind: "details" as const,
			label: agentText(
				"Clear details, keep conversations",
				"清理详情，保留对话",
			),
			pending: agentText("Clearing details…", "正在清理详情…"),
		},
		{
			kind: "all" as const,
			label: agentText("Delete all conversations", "删除全部对话"),
			pending: agentText("Deleting conversations…", "正在删除对话…"),
		},
	];
	const disabled = !account || operation !== null;

	return (
		<SubPageScreen>
			<View style={style.section}>
				<Text style={style.heading} accessibilityRole="header">
					{agentText("Message display", "消息显示")}
				</Text>
				<RoundedView style={style.group}>
					<AdaptiveRow
						style={style.row}
						trailing={
							<Switch
								accessibilityLabel={agentText("Message bubbles", "消息气泡")}
								ios_backgroundColor={colors.inputBorder}
								thumbColor={colors.themeLightGrey}
								trackColor={{
									false: colors.inputBorder,
									true: colors.themePurple,
								}}
								value={bubbleMessage}
								onValueChange={(value) => {
									dispatch(configSet({key: "bubbleMessage", value}));
								}}
							/>
						}>
						<Text style={style.text}>
							{agentText("Message bubbles", "消息气泡")}
						</Text>
					</AdaptiveRow>
				</RoundedView>
				<Text style={style.hint}>
					{agentText(
						"Show a bubble background behind assistant replies.",
						"为助手回复显示气泡背景。",
					)}
				</Text>
			</View>

			{campusModel.thinkingLevels.length > 1 && (
				<View style={style.section}>
					<Text style={style.heading} accessibilityRole="header">
						{agentText("Thinking level", "思考强度")}
					</Text>
					<RoundedView style={style.group} accessibilityRole="radiogroup">
						{campusModel.thinkingLevels.map((level, index) => (
							<Fragment key={level}>
								{index > 0 && <Separator style={style.separator} />}
								<Pressable
									accessibilityRole="radio"
									accessibilityState={{
										checked: level === (agentThinking ?? "default"),
									}}
									style={({pressed}) => [style.row, pressed && style.pressed]}
									onPress={() =>
										dispatch(configSet({key: "agentThinking", value: level}))
									}>
									<Text style={style.text}>{thinkingLabel(level)}</Text>
									{level === (agentThinking ?? "default") && (
										<IconCheck width={18} height={18} />
									)}
								</Pressable>
							</Fragment>
						))}
					</RoundedView>
				</View>
			)}

			<View style={style.section}>
				<Text style={style.heading} accessibilityRole="header">
					{agentText("Conversation storage", "对话存储")}
				</Text>
				<RoundedView style={style.group}>
					<View style={[style.row, isLargeText && style.stackedRow]}>
						<Text style={style.text}>
							{agentText("Used space", "已用空间")}
						</Text>
						<Text style={style.value} accessibilityLiveRegion="polite">
							{usageText}
						</Text>
					</View>
					{currentUsage?.status === "error" && (
						<Pressable
							accessibilityRole="button"
							accessibilityState={{disabled}}
							disabled={disabled}
							style={({pressed}) => [
								style.row,
								pressed && style.pressed,
								disabled && style.disabled,
							]}
							onPress={refresh}>
							<Text style={[style.text, style.link]}>
								{agentText("Retry loading", "重新读取")}
							</Text>
						</Pressable>
					)}
					{actions.map(({kind, label, pending}) => {
						const busy =
							operation?.account === account && operation.kind === kind;
						return (
							<Fragment key={kind}>
								<Separator style={style.separator} />
								<Pressable
									accessibilityRole="button"
									accessibilityLabel={label}
									accessibilityState={{disabled, busy}}
									disabled={disabled}
									style={({pressed}) => [
										style.row,
										pressed && style.pressed,
										disabled && style.disabled,
									]}
									onPress={() => clear(kind)}>
									<Text
										style={[style.text, kind === "all" && style.destructive]}
										accessibilityLiveRegion="polite">
										{busy ? pending : label}
									</Text>
								</Pressable>
							</Fragment>
						);
					})}
				</RoundedView>
				<Text style={style.hint}>
					{account
						? agentText(
								"Conversations are stored on this device until you delete them. Reasoning and model details expire after 7 days and are cleared when you use the assistant.",
								"对话保存在本机，保留至手动删除。思考与模型详情保留 7 天，使用助手时清理。",
							)
						: agentText(
								"Sign in to view and manage conversations stored on this device.",
								"登录后可查看和管理本机对话。",
							)}
				</Text>
				{bytes !== undefined && bytes >= 50 * 1024 * 1024 && (
					<Text style={[style.hint, style.destructive]}>
						{bytes >= 100 * 1024 * 1024
							? agentText(
									"Storage has reached 100 MiB. Clear details to free space while keeping your conversations.",
									"存储已达 100 MiB，可清理详情释放空间，对话文本将保留。",
								)
							: agentText(
									"Storage has reached 50 MiB. You can clear details to free space.",
									"存储已达 50 MiB，可清理详情释放空间。",
								)}
					</Text>
				)}
			</View>
		</SubPageScreen>
	);
};

const styles = themedStyles(({colors}) => ({
	section: {marginBottom: spacing.xl},
	heading: {
		color: colors.fontB2,
		fontSize: fontSize.caption,
		fontWeight: "500",
		marginHorizontal: spacing.lg,
		marginBottom: spacing.sm,
	},
	group: {paddingVertical: 0, overflow: "hidden"},
	row: {
		minHeight: 44,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: spacing.sm,
	},
	stackedRow: {flexDirection: "column", alignItems: "flex-start"},
	text: {
		color: colors.text,
		fontSize: fontSize.body,
		flexShrink: 1,
		minWidth: 0,
	},
	value: {
		color: colors.fontB2,
		fontSize: fontSize.body,
		fontVariant: ["tabular-nums"],
		flexShrink: 1,
	},
	hint: {
		color: colors.fontB2,
		fontSize: fontSize.caption,
		marginHorizontal: spacing.lg,
		marginTop: spacing.sm,
	},
	separator: {marginVertical: 0},
	pressed: {backgroundColor: colors.themeTransparentGrey},
	disabled: {opacity: 0.45},
	destructive: {color: colors.statusWarning},
	link: {color: colors.themePurple},
}));
