import React from "react";
import {WebView} from "react-native-webview";
import {View} from "react-native";
import themes from "../../assets/themes/themes";
import {useColorScheme} from "react-native";

export const PrivacyScreen = () => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<>
			<View
				style={{
					backgroundColor: theme.colors.themeBackground,
					flex: 1,
					padding: 15,
				}}>
				<WebView
					source={{
						uri: "https://thuinfo.net/privacy",
					}}
					containerStyle={{
						backgroundColor: theme.colors.themeBackground,
						color: theme.colors.text,
					}}
					setSupportMultipleWindows={false}
					forceDarkOn={themeName === "dark"}
				/>
			</View>
		</>
	);
};
