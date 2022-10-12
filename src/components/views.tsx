import React, {useState} from "react";
import {
	Modal,
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

export const RoundedView = (props: ViewProps) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return React.createElement(View, {
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
	renderItem: (
		item: T,
		colors: ColorTheme,
		index: number,
	) => React.ReactElement;
	keyExtractor?: (item: T, index: number) => string;
	refreshing?: boolean;
	onRefresh?: () => void;
}

export function RoundedListView<T>(props: ViewProps & ListProps<T>) {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
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
									style={{borderWidth: 0.4, borderColor: colors.themeGrey}}
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
	popupContent: ((done: () => void) => JSX.Element) | JSX.Element;
	popupCanFulfill: boolean;
	popupOnFulfilled: () => void;
	popupOnCancelled: () => void;
	popupOnTriggered?: () => void;
	popupCancelable?: boolean;
}

export const BottomPopupTriggerView = (
	props: TouchableOpacityProps & PopupProps,
) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const touchableProps = {
		...props,
		onPress: () => {
			props.popupOnTriggered?.();
			setOpen(true);
		},
		popupTitle: undefined,
	};

	const [open, setOpen] = useState(false);

	return (
		<>
			<TouchableOpacity {...touchableProps} />
			<Modal visible={open} transparent>
				<TouchableOpacity
					disabled={props.popupCancelable !== true}
					onPress={() => setOpen(false)}
					style={{
						width: "100%",
						height: "100%",
						justifyContent: "flex-end",
					}}>
					<View
						style={{
							position: "absolute",
							backgroundColor: colors.fontB1,
							opacity: 0.1,
							top: 0,
							bottom: 0,
							left: 0,
							right: 0,
						}}
					/>
					<View
						style={{
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
									props.popupOnCancelled();
									setOpen(false);
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
									props.popupOnFulfilled();
									setOpen(false);
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
							? props.popupContent(() => setOpen(false))
							: props.popupContent}
					</View>
				</TouchableOpacity>
			</Modal>
		</>
	);
};
