import {ReactNode, useEffect} from "react";
import {
	BackHandler,
	Pressable,
	ScrollView,
	StyleSheet,
	useColorScheme,
} from "react-native";
import themes from "../assets/themes/themes";
import {getStr} from "../utils/i18n";

/** A filter occupies space directly below its toolbar, without window offsets. */
export const InlineFilterPanel = ({
	visible,
	onClose,
	children,
}: {
	visible: boolean;
	onClose: () => void;
	children: ReactNode;
}) => {
	const {colors} = themes(useColorScheme());
	useEffect(() => {
		if (!visible) return;
		const sub = BackHandler.addEventListener("hardwareBackPress", () => {
			onClose();
			return true;
		});
		return () => sub.remove();
	}, [visible, onClose]);
	return visible ? (
		<ScrollView
			style={{
				flexGrow: 0,
				flexShrink: 1,
				maxHeight: "50%",
				backgroundColor: colors.contentBackground,
				borderBottomStartRadius: 12,
				borderBottomEndRadius: 12,
			}}
			keyboardShouldPersistTaps="handled">
			{children}
		</ScrollView>
	) : null;
};

export const FilterBackdrop = ({
	visible,
	onClose,
}: {
	visible: boolean;
	onClose: () => void;
}) =>
	visible ? (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={getStr("cancel")}
			onPress={onClose}
			style={[StyleSheet.absoluteFill, {backgroundColor: "#0000004d"}]}
		/>
	) : null;
