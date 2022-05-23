import React from "react";
import {WebView} from "react-native-webview";
import {View} from "react-native";
import themes from "../../assets/themes/themes";
import {useColorScheme} from "react-native";

export const WasherWebScreen = () => {
	const themeName = useColorScheme();
	const theme = themes(themeName);

	return (
		<View style={{backgroundColor: theme.colors.themeBackground, flex: 1}}>
			<WebView
				source={{uri: "https://washer.sdevs.top/"}}
				forceDarkOn={themeName === "dark"}
				style={{
					backgroundColor: theme.colors.themeBackground,
					color: theme.colors.text,
				}}
				setSupportMultipleWindows={false}
			/>
		</View>
	);
};
