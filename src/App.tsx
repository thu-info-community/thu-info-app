import "./utils/extensions";
import {Provider, useSelector} from "react-redux";
import {persistor, store} from "./redux/store";
import {PersistGate} from "redux-persist/integration/react";
import React from "react";
import {AuthFlow} from "./components/AuthFlow";
import {DefaultTheme, NavigationContainer} from "@react-navigation/native";
import {StatusBar, useColorScheme} from "react-native";
import themes from "./assets/themes/themes";

const RootComponent = () => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	// @ts-ignore
	const dark = useSelector((s) => s.config.darkMode);
	const darkModeHook = dark || themeName === "dark";
	return (
		<>
			<StatusBar
				barStyle={darkModeHook ? "light-content" : "dark-content"}
				backgroundColor={darkModeHook ? "black" : "white"}
				animated
			/>
			<NavigationContainer
				theme={{
					...DefaultTheme,
					colors: {
						...DefaultTheme.colors,
						text: theme.colors.text,
						background: theme.colors.themeBackground,
						card: theme.colors.contentBackground,
						border: darkModeHook ? "white" : DefaultTheme.colors.border,
					},
				}}>
				<AuthFlow />
			</NavigationContainer>
		</>
	);
};

export const App = () => {
	return (
		<Provider store={store}>
			<PersistGate persistor={persistor}>
				<RootComponent />
			</PersistGate>
		</Provider>
	);
};
