import {BottomTabBarProps} from "@react-navigation/bottom-tabs";
import {CommonActions, Theme, useTheme} from "@react-navigation/native";
import {ReactNode} from "react";
import {
	StyleSheet,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import themes from "../assets/themes/themes";
import {useResponsive} from "../utils/useResponsive";

/** 浮岛尺寸（dp）。 */
const ITEM_WIDTH = 96;
const BAR_HEIGHT = 56;
const BAR_RADIUS = 28;
const ICON_SIZE = 24;
const BADGE_SIZE = 9;
/** 浮岛与屏幕左右边缘的最小间距，窄屏时用它把浮岛压窄。 */
const SIDE_MARGIN = 16;
/** 浮岛内部左右留白（项目宽 96 × 项数之外的部分）。 */
const BAR_PADDING = 12;
/** 浮岛与屏幕底边（安全区之外）的间距。 */
const BOTTOM_GAP = 10;

/**
 * 浮岛占掉的高度（不含安全区）。浮岛是 absolute 的，会盖在 tab 根屏的正文上，
 * 所以各根屏要自己让出这块高度——见 `RootTabs` 的 `sceneStyle`。
 */
export const TAB_BAR_CLEARANCE = BAR_HEIGHT + BOTTOM_GAP;

const labelOf = (
	options: {tabBarLabel?: unknown; title?: string},
	routeName: string,
	props: {focused: boolean; color: string},
): ReactNode => {
	const label = options.tabBarLabel ?? options.title ?? routeName;
	return typeof label === "function"
		? (label as (props: {focused: boolean; color: string}) => ReactNode)(props)
		: (label as ReactNode);
};

/**
 * 宽屏下的底部浮岛导航。原生 tab bar 只能贴着屏幕底边横跨全宽，在平板/折叠屏上
 * 它会一路铺满，把五个图标拉得极远；浮岛把它收成一个居中的胶囊。
 *
 * 所有可配置项都从 `descriptors` 里读（`screenOptions` 已经并进了每个 screen 的
 * options），所以 `RootTabs` 里原有的图标、配色、红点、tabPress 监听都不需要改。
 */
export const FloatingTabBar = ({
	state,
	descriptors,
	navigation,
}: BottomTabBarProps) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const navigationTheme: Theme = useTheme();
	const insets = useSafeAreaInsets();
	const {width} = useResponsive();

	const barWidth = Math.min(
		state.routes.length * ITEM_WIDTH + BAR_PADDING * 2,
		width - SIDE_MARGIN * 2,
	);

	return (
		<View
			pointerEvents="box-none"
			style={{
				position: "absolute",
				left: 0,
				right: 0,
				bottom: 0,
				height: TAB_BAR_CLEARANCE + insets.bottom,
				alignItems: "center",
				justifyContent: "flex-end",
				paddingBottom: insets.bottom + BOTTOM_GAP,
			}}>
			<View
				style={{
					width: barWidth,
					height: BAR_HEIGHT,
					flexDirection: "row",
					justifyContent: "center",
					borderRadius: BAR_RADIUS,
					backgroundColor: colors.contentBackground,
					borderWidth: StyleSheet.hairlineWidth,
					borderColor: colors.themeGrey,
					// 浮岛浮在正文之上，需要一点阴影才能和背景分开
					shadowColor: "#000",
					shadowOpacity: 0.12,
					shadowRadius: 12,
					shadowOffset: {width: 0, height: 4},
					elevation: 8,
				}}>
				{state.routes.map((route, index) => {
					const {options} = descriptors[route.key];
					const focused = state.index === index;
					const color = focused
						? options.tabBarActiveTintColor ?? colors.themeDarkPurple
						: options.tabBarInactiveTintColor ?? colors.text;

					const onPress = () => {
						const event = navigation.emit({
							type: "tabPress",
							target: route.key,
							canPreventDefault: true,
						});
						if (!focused && !event.defaultPrevented) {
							// 与原生 tab bar 完全一致：把 navigate 定向到本 navigator 的
							// state，screen 上的 tabPress 监听（埋点）照常触发。
							navigation.dispatch({
								...CommonActions.navigate(route.name, route.params),
								target: state.key,
							});
						}
					};

					const onLongPress = () => {
						navigation.emit({type: "tabLongPress", target: route.key});
					};

					const badge = options.tabBarBadge;
					const showBadge = badge !== undefined && badge !== null;

					return (
						<TouchableOpacity
							key={route.key}
							accessibilityRole="button"
							accessibilityState={focused ? {selected: true} : {}}
							accessibilityLabel={options.tabBarAccessibilityLabel}
							testID={options.tabBarButtonTestID}
							activeOpacity={0.7}
							onPress={onPress}
							onLongPress={onLongPress}
							style={{
								width: ITEM_WIDTH,
								height: BAR_HEIGHT,
								alignItems: "center",
								justifyContent: "center",
							}}>
							<View>
								{options.tabBarIcon?.({
									focused,
									color,
									size: ICON_SIZE,
								})}
								{showBadge && (
									<View
										style={[
											{
												position: "absolute",
												top: -2,
												right: -6,
												minWidth: BADGE_SIZE,
												height: BADGE_SIZE,
												borderRadius: BADGE_SIZE / 2,
												backgroundColor: navigationTheme.colors.notification,
												alignItems: "center",
												justifyContent: "center",
											},
											options.tabBarBadgeStyle,
										]}>
										{typeof badge === "string" || typeof badge === "number" ? (
											badge === "" ? null : (
												<Text
													style={{
														color: "white",
														fontSize: 9,
														lineHeight: BADGE_SIZE,
													}}>
													{badge}
												</Text>
											)
										) : (
											badge
										)}
									</View>
								)}
							</View>
							<Text
								numberOfLines={1}
								style={[
									{fontSize: 11, color, marginTop: 2},
									options.tabBarLabelStyle,
								]}>
								{labelOf(options, route.name, {focused, color})}
							</Text>
						</TouchableOpacity>
					);
				})}
			</View>
		</View>
	);
};
