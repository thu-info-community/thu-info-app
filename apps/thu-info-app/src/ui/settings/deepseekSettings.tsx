import {getStr} from "../../utils/i18n";
import {
	Switch,
	Text,
	useColorScheme,
	View,
	Alert,
	Pressable,
	ScrollView,
} from "react-native";
import {useEffect, useState} from "react";
import {RoundedView} from "../../components/views";
import {styles} from "./settings";
import themes from "../../assets/themes/themes";
import {useDispatch, useSelector} from "react-redux";
import {State} from "../../redux/store";
import {configSet} from "../../redux/slices/config";
import {agentService} from "../../agent/service";
import {campusModel} from "../../agent/types";
import {agentText} from "../home/agentDeepseek";
import {deepseekClear} from "../../redux/slices/deepseek";

export const DeepSeekSettingsScreen = () => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	const {colors} = themes(themeName);

	const enableBubbleMessage = useSelector((s: State) => s.config.bubbleMessage);
	const dispatch = useDispatch();
	const {agentEnabled, agentThinking} = useSelector((s: State) => s.config);
	const account = useSelector((s: State) => s.auth.userId);
	const [usage, setUsage] = useState(0);
	const [busy, setBusy] = useState(false);
	const refresh = () =>
		account
			? agentService.forAccount(account).usage().then(setUsage)
			: Promise.resolve();
	useEffect(() => {
		void refresh().catch(() => {});
	}, [account]); // eslint-disable-line react-hooks/exhaustive-deps
	const clear = (all: boolean) =>
		Alert.alert(
			getStr("confirm"),
			all
				? getStr("deleteAllHistoryConfirm")
				: agentText(
						"Remove reasoning, tool detail and resumable model context. Conversation text and action receipts are kept. Pending approvals will be invalidated.",
						"清除思考内容、工具详情和模型上下文，保留对话文本及操作记录。待确认的操作将失效。",
					),
			[
				{text: getStr("cancel")},
				{
					text: getStr("confirm"),
					style: "destructive",
					onPress: async () => {
						setBusy(true);
						try {
							if (all) {
								await agentService.clear(account);
								dispatch(deepseekClear());
							} else {
								await agentService.clearDetails();
							}
							await refresh();
						} catch (e) {
							Alert.alert("THUInfo", String(e));
						} finally {
							setBusy(false);
						}
					},
				},
			],
		);
	return (
		<ScrollView contentContainerStyle={{padding: 12, paddingTop: 0}}>
			<RoundedView style={style.rounded}>
				<View style={style.touchable}>
					<Text style={style.text}>
						{agentText("Agent mode (preview)", "智能体模式（预览）")}
					</Text>
					<Switch
						accessibilityLabel="Agent mode"
						ios_backgroundColor={colors.inputBorder}
						thumbColor={colors.themeLightGrey}
						trackColor={{false: colors.inputBorder, true: colors.themePurple}}
						value={agentEnabled ?? false}
						disabled={busy || !account}
						onValueChange={(value) => {
							dispatch(configSet({key: "agentEnabled", value}));
						}}
					/>
				</View>
				<Text style={{color: colors.fontB3, padding: 16}}>
					{agentText(
						"Runs on this device through the campus Chat Completions gateway. Requested local schedules, favorites and subscriptions may be updated directly. Bookings, course changes, messages, payments, account changes and bulk writes require approval. Secrets and payments stay in native screens. Preview remains opt-in until gateway and device verification is complete.",
						"通过校园 Chat Completions 接口在本机运行。明确要求的本地日程、收藏、订阅可直接更新；预约、选课、发送消息、支付、账号变更及批量操作需确认。密码和支付在原生页面完成。完成接口及真机验证前需手动启用预览。",
					)}
				</Text>
			</RoundedView>
			<RoundedView style={style.rounded}>
				<Text style={[style.text, {padding: 16}]}>
					{agentText("Thinking level", "思考强度")}
				</Text>
				{campusModel.thinkingLevels.map((level) => (
					<Pressable
						key={level}
						accessibilityRole="radio"
						accessibilityState={{
							checked: level === (agentThinking ?? "default"),
						}}
						style={style.touchable}
						onPress={() =>
							dispatch(configSet({key: "agentThinking", value: level}))
						}>
						<Text style={style.text}>
							{level === "default"
								? agentText("Provider default", "模型默认")
								: level}
							{level === (agentThinking ?? "default") ? " ✓" : ""}
						</Text>
					</Pressable>
				))}
				<Text style={{color: colors.fontB3, padding: 16}}>
					{agentText(
						"Only levels verified on the campus gateway are offered. Default sends no reasoning override.",
						"仅显示校园接口已验证支持的强度。默认不发送思考强度参数。",
					)}
				</Text>
			</RoundedView>
			<RoundedView style={style.rounded}>
				<Text style={[style.text, {padding: 16}]}>
					{agentText("Conversation storage", "对话存储")}:{" "}
					{(usage / 1024 / 1024).toFixed(1)} MiB
				</Text>
				<Text
					style={{
						color:
							usage >= 50 * 1024 * 1024 ? colors.statusWarning : colors.fontB3,
						padding: 16,
					}}>
					{agentText(
						"Conversation text is kept until you delete it. Reasoning and model traces expire after 7 days; cleanup runs when the agent is used. Large tool results are transient. Warnings appear at 50 and 100 MiB; there is no automatic text deletion or fixed storage cap.",
						"对话文本保留至手动删除。思考内容和模型详情保留 7 天，使用智能体时清理；大型工具结果仅临时缓存。50 和 100 MiB 时提示，不设固定上限，不自动删除对话文本。",
					)}
				</Text>
				<Pressable
					style={style.touchable}
					disabled={busy || !account}
					onPress={() => clear(false)}>
					<Text style={style.text}>
						{agentText(
							"Clear details, keep conversations",
							"清理详情，保留对话",
						)}
					</Text>
				</Pressable>
				<Pressable
					style={style.touchable}
					disabled={busy || !account}
					onPress={() => clear(true)}>
					<Text style={[style.text, {color: colors.statusWarning}]}>
						{agentText("Delete all conversations", "删除全部对话")}
					</Text>
				</Pressable>
			</RoundedView>
			<RoundedView style={style.rounded}>
				<View style={style.touchable}>
					<Text style={style.text}>{getStr("enableBubbleMessage")}</Text>
					<Switch
						ios_backgroundColor={colors.inputBorder}
						thumbColor={colors.themeLightGrey}
						trackColor={{false: colors.inputBorder, true: colors.themePurple}}
						value={enableBubbleMessage}
						onValueChange={(value: boolean) => {
							dispatch(
								configSet({
									key: "bubbleMessage",
									value: value,
								}),
							);
						}}
					/>
				</View>
				<Text
					style={{
						marginHorizontal: 16,
						marginTop: 8,
						color: colors.fontB3,
						fontSize: 12,
					}}>
					{getStr("bubbleMessageHint")}
				</Text>
			</RoundedView>
		</ScrollView>
	);
};
