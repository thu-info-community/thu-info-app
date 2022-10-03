import React from "react";
import {WebView} from "react-native-webview";
import {View} from "react-native";
import themes from "../../assets/themes/themes";
import {useColorScheme} from "react-native";

export const WasherWebScreen = () => {
	const themeName = useColorScheme();
	const theme = themes(themeName);

	// Override the webpage color theme with ours
	const injectedJS = `
		var style = document.createElement("style");
		style.textContent = \`
			div { color: ${theme.colors.text} !important; }
			a { color: ${theme.colors.themePurple} !important; }
			.l-box-header { background-color: ${theme.colors.themeBackground} !important; }
			.l-box {
				background-color: ${theme.colors.themeBackground} !important;
				border-top: 1px solid ${theme.colors.inputBorder} !important;
			}
			.washer-hex { background-color: ${theme.colors.themePurple} !important; }
			.status-idle { background-color: ${theme.colors.contentBackground} !important; }
			.status-error { background-color: ${theme.colors.statusError} !important; }
			.pure-button-primary { background-color: ${theme.colors.themePurple} !important; }
		\`
		document.getElementsByTagName("head")[0].appendChild(style);
	`;

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
				injectedJavaScript={injectedJS}
			/>
		</View>
	);
};
