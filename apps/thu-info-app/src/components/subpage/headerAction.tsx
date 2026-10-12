import {ReactNode} from "react";
import {StyleProp, TouchableOpacity, ViewStyle} from "react-native";
import {spacing} from "./tokens";

/**
 * A navigation-header action holding either an icon or a text glyph. Header
 * actions used to declare their own padding/margin, which drifted (8 vs 16
 * horizontal padding, `margin` vs `marginHorizontal`); they all share this
 * geometry now. Callers keep ownership of the glyph itself.
 */
export const HeaderActionButton = ({
	onPress,
	disabled,
	testID,
	accessibilityLabel,
	style,
	children,
}: {
	onPress: () => void;
	disabled?: boolean;
	testID?: string;
	accessibilityLabel?: string;
	style?: StyleProp<ViewStyle>;
	children: ReactNode;
}) => {
	return (
		<TouchableOpacity
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
			accessibilityState={{disabled: !!disabled}}
			disabled={disabled}
			testID={testID}
			onPress={onPress}
			style={[
				{
					paddingHorizontal: spacing.lg,
					marginHorizontal: spacing.xs,
					opacity: disabled ? 0.5 : 1,
				},
				style,
			]}>
			{children}
		</TouchableOpacity>
	);
};
