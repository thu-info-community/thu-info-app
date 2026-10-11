import {ReactNode} from "react";
import {StyleProp, Text, useColorScheme, View, ViewStyle} from "react-native";
import themes from "../../assets/themes/themes";

/**
 * A row that keeps its text visible under a large system font.
 *
 * It replaces the failing shape: a `flexDirection:"row"` row whose middle label
 * has no `flexShrink`, so at `font_scale 2.0` the label keeps its full intrinsic
 * width (RN defaults `flexShrink` to 0) and shoves the trailing control -- the
 * chevron, switch or badge that makes the row usable -- off the screen. Here the
 * middle slot owns the leftover width and wraps, and the leading/trailing slots
 * are pinned so they stay reachable. There is no fixed height and no
 * `numberOfLines`, so the row grows with its content.
 */
export const AdaptiveRow = ({
	leading,
	trailing,
	children,
	style,
	testID,
}: {
	leading?: ReactNode;
	trailing?: ReactNode;
	children: ReactNode;
	style?: StyleProp<ViewStyle>;
	testID?: string;
}) => (
	<View
		testID={testID}
		style={[{flexDirection: "row", alignItems: "center"}, style]}>
		{leading ? (
			<View style={{flexShrink: 0, marginRight: 10}}>{leading}</View>
		) : null}
		<View style={{flex: 1, minWidth: 0}}>{children}</View>
		{trailing ? (
			<View style={{flexShrink: 0, marginLeft: 10}}>{trailing}</View>
		) : null}
	</View>
);

/**
 * A label with a value on the same row, laid out so neither can overflow the
 * other off-screen. The label shrinks and wraps; the value keeps its width (a
 * semester name or an amount is essential and must not be truncated), capped at
 * `valueMaxWidth` of the row so it cannot crowd the label out entirely. Pass
 * `valueNumberOfLines` only for a genuinely unbounded value (an ID, a timestamp).
 */
export const AdaptiveLabelValueRow = ({
	label,
	value,
	valueNumberOfLines,
	valueMaxWidth = "55%",
	leading,
	trailing,
	style,
	testID,
}: {
	label: string;
	value: string;
	valueNumberOfLines?: number;
	valueMaxWidth?: number | string;
	leading?: ReactNode;
	trailing?: ReactNode;
	style?: StyleProp<ViewStyle>;
	testID?: string;
}) => {
	const {colors} = themes(useColorScheme());
	return (
		<AdaptiveRow
			testID={testID}
			leading={leading}
			trailing={trailing}
			style={style}>
			<View style={{flexDirection: "row", alignItems: "center"}}>
				<Text style={{flexShrink: 1, minWidth: 0, color: colors.text, fontSize: 16}}>
					{label}
				</Text>
				<Text
					numberOfLines={valueNumberOfLines}
					style={{
						flexShrink: 0,
						maxWidth: valueMaxWidth,
						marginLeft: 8,
						color: colors.fontB3,
						fontSize: 16,
					}}>
					{value}
				</Text>
			</View>
		</AdaptiveRow>
	);
};
