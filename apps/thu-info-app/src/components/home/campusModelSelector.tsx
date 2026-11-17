import {useCallback, useEffect, useRef, useState} from "react";
import {
	ActivityIndicator,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	useColorScheme,
	View,
} from "react-native";
import type {StyleProp, TextStyle} from "react-native";
import {useDispatch, useSelector} from "react-redux";
import {useFocusEffect} from "@react-navigation/native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import themes from "../../assets/themes/themes";
import IconDown from "../../assets/icons/IconDown";
import {getCampusModels} from "../../agent/modelCatalog";
import {configSet} from "../../redux/slices/config";
import type {State} from "../../redux/store";
import {selectedCampusModel} from "../../utils/campusModel";
import {getStr} from "../../utils/i18n";
import {fontSize, spacing} from "../subpage/tokens";
import {agentText} from "./agentChatPresentation";

export const CampusModelSelector = ({
	disabled,
	activeModel,
	titleStyle,
	subtitleStyle,
}: {
	disabled: boolean;
	activeModel?: string;
	titleStyle: StyleProp<TextStyle>;
	subtitleStyle: StyleProp<TextStyle>;
}) => {
	const models = useSelector(
		(state: State) => state.deepseek.modelCache?.models,
	);
	const preferred = useSelector(
		(state: State) => state.config.deepseekModelName,
	);
	const selected = selectedCampusModel(models ?? [], preferred);
	const name = activeModel ?? selected;
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [failed, setFailed] = useState(false);
	const mounted = useRef(false);
	const dispatch = useDispatch();
	const {colors} = themes(useColorScheme());
	const insets = useSafeAreaInsets();
	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);
	const refresh = useCallback(async (force = false) => {
		setLoading(true);
		setFailed(false);
		try {
			await getCampusModels(force);
		} catch {
			if (mounted.current) setFailed(true);
		} finally {
			if (mounted.current) setLoading(false);
		}
	}, []);
	useFocusEffect(
		useCallback(() => {
			void refresh();
		}, [refresh]),
	);
	useEffect(() => {
		if (disabled) setOpen(false);
	}, [disabled]);
	const label = agentText("Select model", "选择模型");
	const empty = failed
		? agentText(
				"Couldn't load models. Try again.",
				"模型列表获取失败，请重试。",
			)
		: loading
			? agentText("Loading models…", "正在获取模型…")
			: agentText("No models available", "暂无可用模型");
	return (
		<>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={`${label}${name ? `, ${name}` : ""}`}
				accessibilityState={{disabled, expanded: open}}
				disabled={disabled}
				style={styles.trigger}
				onPress={() => setOpen(true)}>
				<Text
					accessibilityRole="header"
					style={[titleStyle, {color: colors.fontB0}]}>
					{getStr("deepseek")}
				</Text>
				<View style={styles.subtitle}>
					<Text style={[subtitleStyle, styles.name, {color: colors.fontB2}]}>
						{name ?? empty}
					</Text>
					<IconDown width={14} height={14} />
				</View>
			</Pressable>
			<Modal
				visible={open}
				transparent
				animationType="slide"
				onRequestClose={() => setOpen(false)}>
				<View style={styles.overlay}>
					<Pressable
						style={[
							StyleSheet.absoluteFill,
							{backgroundColor: colors.themeDarkGrey, opacity: 0.5},
						]}
						accessibilityRole="button"
						accessibilityLabel={getStr("cancel")}
						onPress={() => setOpen(false)}
					/>
					<View
						accessibilityViewIsModal
						style={[
							styles.sheet,
							{
								backgroundColor: colors.contentBackground,
								paddingBottom: Math.max(insets.bottom, spacing.lg),
							},
						]}>
						<Text
							accessibilityRole="header"
							style={[styles.heading, {color: colors.text}]}>
							{label}
						</Text>
						<ScrollView>
							{models?.map((model) => (
								<Pressable
									key={model}
									accessibilityRole="radio"
									accessibilityState={{checked: model === selected}}
									style={({pressed}) => [
										styles.row,
										{
											backgroundColor:
												model === selected
													? colors.themeTransparentPurple
													: pressed
														? colors.themeTransparentGrey
														: colors.transparent,
										},
									]}
									onPress={() => {
										dispatch(
											configSet({key: "deepseekModelName", value: model}),
										);
										setOpen(false);
									}}>
									<Text
										style={[
											styles.model,
											{
												color:
													model === selected ? colors.themePurple : colors.text,
											},
										]}>
										{model}
									</Text>
								</Pressable>
							))}
							{!models?.length && (
								<Text style={[styles.hint, {color: colors.fontB2}]}>
									{empty}
								</Text>
							)}
						</ScrollView>
						<Pressable
							accessibilityRole="button"
							disabled={loading}
							accessibilityState={{disabled: loading, busy: loading}}
							style={styles.row}
							onPress={() => {
								void refresh(true);
							}}>
							{loading ? (
								<ActivityIndicator color={colors.themePurple} />
							) : (
								<Text style={[styles.model, {color: colors.themePurple}]}>
									{agentText("Refresh models", "刷新模型列表")}
								</Text>
							)}
						</Pressable>
						<Pressable
							accessibilityRole="button"
							style={styles.row}
							onPress={() => setOpen(false)}>
							<Text style={[styles.model, {color: colors.text}]}>
								{getStr("cancel")}
							</Text>
						</Pressable>
					</View>
				</View>
			</Modal>
		</>
	);
};

const styles = StyleSheet.create({
	trigger: {minHeight: 48, justifyContent: "center"},
	subtitle: {flexDirection: "row", alignItems: "center", gap: spacing.xs},
	name: {flexShrink: 1},
	overlay: {flex: 1, justifyContent: "flex-end"},
	sheet: {
		maxHeight: "75%",
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		paddingTop: spacing.lg,
	},
	heading: {
		fontSize: fontSize.title,
		fontWeight: "600",
		marginHorizontal: spacing.lg,
		marginBottom: spacing.md,
	},
	row: {
		minHeight: 48,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
		justifyContent: "center",
	},
	model: {fontSize: fontSize.body},
	hint: {
		fontSize: fontSize.body,
		marginHorizontal: spacing.lg,
		marginVertical: spacing.md,
	},
});
