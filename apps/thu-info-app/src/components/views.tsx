import {createElement, ReactElement, useCallback, useEffect, useRef, useState} from "react";
import {
	Animated,
	BackHandler,
	Dimensions,
	Easing,
	GestureResponderEvent,
	Modal,
	PanResponder,
	PanResponderGestureState,
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	TouchableOpacityProps,
	useColorScheme,
	View,
	ViewProps,
} from "react-native";
import themes, {ColorTheme} from "../assets/themes/themes";
import {getStr} from "../utils/i18n";
import {styles} from "../ui/settings/settings";

export const RoundedView = (props: ViewProps) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return createElement(View, {
		...props,
		style: [
			{
				backgroundColor: colors.contentBackground,
				borderRadius: 12,
				paddingVertical: 16,
			},
			props.style,
		],
	});
};

interface ListProps<T> {
	data: T[];
	renderItem: (item: T, colors: ColorTheme, index: number) => ReactElement;
	keyExtractor?: (item: T, index: number) => string;
	refreshing?: boolean;
	onRefresh?: () => void;
}

export function RoundedListView<T>(props: ViewProps & ListProps<T>) {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const style = styles(themeName);
	const viewProps = {
		...props,
		data: undefined,
		renderItem: undefined,
		keyExtractor: undefined,
		refreshing: undefined,
		onRefresh: undefined,
	};
	return (
		<ScrollView
			refreshControl={
				props.refreshing !== undefined && props.onRefresh !== undefined ? (
					<RefreshControl
						refreshing={props.refreshing}
						onRefresh={props.onRefresh}
						colors={[colors.accent]}
						progressBackgroundColor={colors.contentBackground}
					/>
				) : undefined
			}
			{...viewProps}>
			{props.data.length > 0 && (
				<RoundedView style={{padding: 16}}>
					{props.data.map((item, index) => (
						<View key={props.keyExtractor?.(item, index)}>
							{index > 0 && (
								<View
									style={[
										style.separator,
										{
											marginHorizontal: 0,
											marginVertical: 0,
										},
									]}
								/>
							)}
							{props.renderItem(item, colors, index)}
						</View>
					))}
				</RoundedView>
			)}
		</ScrollView>
	);
}

interface PopupProps {
	popupTitle: string;
	popupContent: ((done: () => void) => ReactElement) | ReactElement;
	popupCanFulfill: boolean;
	popupOnFulfilled: () => void;
	popupOnCancelled: () => void;
	popupOnTriggered?: () => void;
	popupCancelable?: boolean;
}

type SheetState =
	| "closed"
	| "opening"
	| "open"
	| "dragging"
	| "closing-backdrop"
	| "closing-pull"
	| "closing-edge"
	| "closing-system"
	| "settling";

type CloseType = "backdrop" | "pull" | "edge" | "system";

interface PhysicsParams {
	stiffness: number;
	damping: number;
	mass: number;
}

interface GestureState {
	startY: number;
	lastY: number;
	velocityY: number;
	isDragging: boolean;
}

// 8px 时间网格：80ms 的倍数
const BACKDROP_TAP_FEEDBACK_DURATION = 80; // 规范：按下反馈 80ms
const BACKDROP_EXIT_DURATION = 280; // 规范：点击遮罩关闭 280ms
const BACKDROP_OPACITY_EXIT_DURATION = 250; // 规范：遮罩略快 250ms
const PULL_FAST_CLOSE_DURATION = 200; // 规范：高速关闭 200ms
const PULL_SLOW_CLOSE_DURATION = 300; // 规范：慢速关闭 300ms
const EDGE_CLOSE_DURATION = 200; // 规范：系统返回 200ms

// Easing 曲线（按规范数值）
const ENTER_EASING = Easing.bezier(0.32, 0.72, 0, 1); // 规范：ENTER_EASING = [0.32, 0.72, 0, 1]
const EASE_IN_EXIT = Easing.bezier(0.4, 0, 1, 1); // 规范：cubic-bezier(0.4, 0, 1, 1)
const EASE_OUT_SYSTEM = Easing.bezier(0.25, 0.1, 0.25, 1); // 规范：系统级 ease-out
const EASE_PULL_FAST = Easing.bezier(0.25, 0.46, 0.45, 0.94); // 规范：高速关闭

const SPRING_PARAMS: PhysicsParams = {
	// 规范：stiffness 400，damping 25，mass 1
	stiffness: 400,
	damping: 25,
	mass: 1,
};

const BACKDROP_MAX_OPACITY = 0.6;

export const BottomPopupTriggerView = (props: TouchableOpacityProps & PopupProps) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const screenHeight = Dimensions.get("window").height;

	const [sheetState, setSheetState] = useState<SheetState>("closed");
	const [visible, setVisible] = useState(false);

	const translateY = useRef(new Animated.Value(screenHeight)).current;
	const backdropOpacity = useRef(new Animated.Value(0)).current;
	const gestureState = useRef<GestureState>({
		startY: 0,
		lastY: 0,
		velocityY: 0,
		isDragging: false,
	});

	const handleOpen = useCallback(() => {
		props.popupOnTriggered?.();
		setVisible(true);
		setSheetState("opening");
		translateY.setValue(screenHeight);
		backdropOpacity.setValue(0);

		Animated.parallel([
			Animated.timing(translateY, {
				toValue: 0,
				duration: 240, // 80ms * 3，进入动效
				easing: ENTER_EASING,
				useNativeDriver: true,
			}),
			Animated.timing(backdropOpacity, {
				toValue: BACKDROP_MAX_OPACITY,
				duration: 240,
				easing: ENTER_EASING,
				useNativeDriver: true,
			}),
		]).start(() => {
			setSheetState("open");
		});
	}, [backdropOpacity, props, screenHeight, translateY]);

	const runSpringBackToZero = useCallback(() => {
		setSheetState("settling");
		Animated.spring(translateY, {
			toValue: 0,
			stiffness: SPRING_PARAMS.stiffness,
			damping: SPRING_PARAMS.damping,
			mass: SPRING_PARAMS.mass,
			useNativeDriver: true,
		}).start(() => {
			setSheetState("open");
			backdropOpacity.setValue(BACKDROP_MAX_OPACITY);
		});
	}, [backdropOpacity, translateY]);

	const animateCloseWith = useCallback(
		(
			closeType: CloseType,
			onFinished: () => void,
			override?: {duration?: number; backdropDuration?: number; easing?: (value: number) => number},
		) => {
			if (sheetState === "closed") {
				onFinished();
				return;
			}

			let baseDuration = BACKDROP_EXIT_DURATION;
			let baseBackdropDuration = BACKDROP_OPACITY_EXIT_DURATION;
			let baseEasing = EASE_IN_EXIT;

			if (closeType === "edge" || closeType === "system") {
				baseDuration = EDGE_CLOSE_DURATION;
				baseBackdropDuration = EDGE_CLOSE_DURATION;
				baseEasing = EASE_OUT_SYSTEM;
			}

			const duration = override?.duration ?? baseDuration;
			const backdropDuration = override?.backdropDuration ?? baseBackdropDuration;
			const easing = override?.easing ?? baseEasing;

			setSheetState(
				closeType === "backdrop"
					? "closing-backdrop"
					: closeType === "pull"
					? "closing-pull"
					: closeType === "edge"
					? "closing-edge"
					: "closing-system",
			);

			Animated.parallel([
				Animated.timing(translateY, {
					toValue: screenHeight,
					duration,
					easing,
					useNativeDriver: true,
				}),
				Animated.timing(backdropOpacity, {
					toValue: 0,
					duration: backdropDuration,
					easing,
					useNativeDriver: true,
				}),
			]).start(() => {
				setSheetState("closed");
				setVisible(false);
				onFinished();
				translateY.setValue(screenHeight);
				backdropOpacity.setValue(0);
			});
		},
		[backdropOpacity, screenHeight, sheetState, translateY],
	);

	const handleBackdropClose = useCallback(() => {
		if (props.popupCancelable !== true) {
			return;
		}
		// 按下反馈：opacity 瞬间降低到约 0.45（0.6 * 0.75），80ms
		Animated.timing(backdropOpacity, {
			toValue: BACKDROP_MAX_OPACITY * 0.75,
			duration: BACKDROP_TAP_FEEDBACK_DURATION,
			easing: Easing.linear,
			useNativeDriver: true,
		}).start(() => {
			animateCloseWith("backdrop", props.popupOnCancelled, {
				duration: BACKDROP_EXIT_DURATION,
				backdropDuration: BACKDROP_OPACITY_EXIT_DURATION,
				easing: EASE_IN_EXIT,
			});
		});
	}, [animateCloseWith, backdropOpacity, props]);

	const handleSystemClose = useCallback(() => {
		if (props.popupCancelable !== true) {
			return false;
		}
		animateCloseWith("system", props.popupOnCancelled);
		return true;
	}, [animateCloseWith, props]);

	// Android 实体返回键映射为系统关闭动效
	useEffect(() => {
		if (!visible) {
			return;
		}
		const sub = BackHandler.addEventListener("hardwareBackPress", handleSystemClose);
		return () => {
			sub.remove();
		};
	}, [handleSystemClose, visible]);

	// 下拉关闭手势
	const panResponder = useRef(
		PanResponder.create({
			onMoveShouldSetPanResponder: (_evt: GestureResponderEvent, gestureStateNative: PanResponderGestureState) => {
				if (sheetState !== "open" && sheetState !== "dragging") {
					return false;
				}
				const {dy, dx} = gestureStateNative;
				// 纵向为主，避免与横向滑动冲突
				return Math.abs(dy) > 4 && Math.abs(dy) > Math.abs(dx) * 1.5;
			},
			onPanResponderGrant: () => {
				gestureState.current = {
					startY: 0,
					lastY: 0,
					velocityY: 0,
					isDragging: true,
				};
				setSheetState("dragging");
			},
			onPanResponderMove: (_evt: GestureResponderEvent, gestureStateNative: PanResponderGestureState) => {
				if (!gestureState.current.isDragging) {
					return;
				}
				const rawY = Math.max(0, gestureStateNative.dy);
				const resistance = 1 - (rawY / screenHeight) * 0.25; // 规范：Rubber Band 阻力
				const y = rawY * resistance;
				const ratio = Math.min(1, Math.max(0, y / screenHeight));

				translateY.setValue(y);
				backdropOpacity.setValue(BACKDROP_MAX_OPACITY * (1 - ratio));

				gestureState.current = {
					startY: 0,
					lastY: y,
					velocityY: gestureStateNative.vy * screenHeight,
					isDragging: true,
				};
			},
			onPanResponderRelease: () => {
				if (!gestureState.current.isDragging) {
					return;
				}
				gestureState.current.isDragging = false;
				const finalY = gestureState.current.lastY;
				const velocityPx = gestureState.current.velocityY;

				const fastClose = velocityPx > 800; // 规范：速度 > 800px/s
				const farEnough = finalY > screenHeight * 0.35; // 规范：位移 > 35% 屏幕高度

				if (fastClose || farEnough) {
					animateCloseWith(
						"pull",
						props.popupOnCancelled,
						fastClose
							? {
									duration: PULL_FAST_CLOSE_DURATION,
									backdropDuration: PULL_FAST_CLOSE_DURATION,
									easing: EASE_PULL_FAST,
							  }
							: {
									duration: PULL_SLOW_CLOSE_DURATION,
									backdropDuration: PULL_SLOW_CLOSE_DURATION,
									easing: EASE_IN_EXIT,
							  },
					);
				} else {
					// 未达阈值：物理弹簧回弹
					runSpringBackToZero();
				}
			},
			onPanResponderTerminate: () => {
				if (gestureState.current.isDragging) {
					gestureState.current.isDragging = false;
					runSpringBackToZero();
				}
			},
		}),
	).current;

	const triggerProps = {
		...props,
		onPress: handleOpen,
		popupTitle: undefined,
	};

	return (
		<>
			<TouchableOpacity {...triggerProps} />
			<Modal visible={visible} transparent onRequestClose={handleSystemClose}>
				<Animated.View
					style={{
						width: "100%",
						height: "100%",
						justifyContent: "flex-end",
						backgroundColor: "transparent",
					}}>
					{/* 遮罩层：点击关闭 */}
					<Animated.View
						style={{
							position: "absolute",
							top: 0,
							bottom: 0,
							left: 0,
							right: 0,
							backgroundColor: colors.fontB1,
							opacity: backdropOpacity,
						}}
					/>
					<TouchableOpacity
						activeOpacity={1}
						style={{flex: 1}}
						disabled={props.popupCancelable !== true}
						onPress={handleBackdropClose}
					/>
					{/* 抽屉本体，可下拉关闭 */}
					<Animated.View
						{...panResponder.panHandlers}
						style={{
							transform: [{translateY}],
							backgroundColor: colors.contentBackground,
							borderTopStartRadius: 12,
							borderTopEndRadius: 12,
						}}>
						<View
							style={{
								flexDirection: "row",
								margin: 16,
								alignItems: "center",
								justifyContent: "center",
							}}>
							<Text
								style={{
									color: colors.fontB1,
									fontSize: 18,
									fontWeight: "500",
								}}>
								{props.popupTitle}
							</Text>
							<TouchableOpacity
								style={{
									position: "absolute",
									left: 0,
								}}
								onPress={() => {
									animateCloseWith("backdrop", props.popupOnCancelled);
								}}>
								<Text
									style={{
										color: colors.fontB1,
										fontSize: 16,
										fontWeight: "400",
									}}>
									{getStr("cancel")}
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={{
									position: "absolute",
									right: 0,
								}}
								disabled={!props.popupCanFulfill}
								onPress={() => {
									if (!props.popupCanFulfill) {
										return;
									}
									animateCloseWith("backdrop", props.popupOnFulfilled);
								}}>
								<Text
									style={{
										color: props.popupCanFulfill
											? colors.themePurple
											: colors.themeGrey,
										fontSize: 16,
										fontWeight: "600",
									}}>
									{getStr("done")}
								</Text>
							</TouchableOpacity>
						</View>
						{typeof props.popupContent === "function"
							? props.popupContent(() => animateCloseWith("backdrop", props.popupOnCancelled))
							: props.popupContent}
					</Animated.View>
				</Animated.View>
			</Modal>
		</>
	);
};
