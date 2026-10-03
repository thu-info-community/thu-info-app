import {Text, TextProps, View} from "react-native";
import {Cursor} from "react-native-confirmation-code-field";
import themes from "../assets/themes/themes";

export const CodeInputCell = ({
	symbol,
	focused,
	masked = false,
	colors,
	onLayout,
}: {
	symbol: string;
	focused: boolean;
	masked?: boolean;
	colors: ReturnType<typeof themes>["colors"];
	onLayout: TextProps["onLayout"];
}) => (
	<View
		style={{
			flex: 1,
			maxWidth: 55,
			minWidth: 0,
			minHeight: masked ? 56 : 73,
			...(masked ? {paddingHorizontal: 12, paddingVertical: 8} : {}),
			borderWidth: 2,
			borderColor: focused ? colors.mainTheme : colors.themeGrey,
			borderRadius: 12,
			justifyContent: "center",
		}}>
		<Text
			style={{fontSize: 32, textAlign: "center", color: colors.primaryLight}}
			onLayout={onLayout}>
			{symbol ? masked ? "*" : symbol : focused ? <Cursor /> : null}
		</Text>
	</View>
);
