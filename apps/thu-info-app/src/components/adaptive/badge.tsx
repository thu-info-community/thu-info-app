import {StyleProp, Text, View, ViewStyle} from "react-native";
import {useScaledSize} from "./scaledBox";

/** The floating tab bar's unread-dot size at font scale 1. */
const BADGE_BASE = 9;

/**
 * The unread dot/badge over a tab icon.
 *
 * A fixed 9dp circle with a 9pt label both clips and becomes unreadable at a large
 * system font, so the circle grows with the layout scale and its label is sized
 * from the circle rather than pinned to a fixed `lineHeight`. An empty `label`
 * renders the plain dot the app ships today.
 */
export const AdaptiveBadge = ({
	label,
	color,
	style,
	testID,
}: {
	label?: string;
	color: string;
	style?: StyleProp<ViewStyle>;
	testID?: string;
}) => {
	const size = useScaledSize(BADGE_BASE);
	return (
		<View
			testID={testID}
			style={[
				{
					minWidth: size,
					minHeight: size,
					borderRadius: size / 2,
					backgroundColor: color,
					alignItems: "center",
					justifyContent: "center",
					paddingHorizontal: label ? Math.round(size / 3) : 0,
				},
				style,
			]}>
			{label ? (
				<Text style={{color: "white", fontSize: Math.round(size * 0.7)}}>
					{label}
				</Text>
			) : null}
		</View>
	);
};
