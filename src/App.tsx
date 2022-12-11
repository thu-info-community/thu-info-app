import "./utils/extensions";
import {Provider, useSelector} from "react-redux";
import {navigationRef, persistor, State, store} from "./redux/store";
import {PersistGate} from "redux-persist/integration/react";
import {useEffect} from "react";
import {DefaultTheme, NavigationContainer} from "@react-navigation/native";
import {StatusBar, useColorScheme} from "react-native";
import themes from "./assets/themes/themes";
import {checkBroadcast, checkUpdate} from "./utils/checkUpdate";
import {DigitalPasswordScreen} from "./ui/settings/digitalPassword";
import {Root} from "./components/Root";
import {addStartupStat} from "./utils/webApi";

const RootComponent = () => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	const dark = useSelector((s: State) => s.config.darkMode);
	const darkModeHook = dark || themeName === "dark";

	const appLocked = useSelector((s: State) => s.config.appLocked);

	useEffect(() => {
		checkUpdate();
		checkBroadcast();
		addStartupStat();
	}, []);

	return (
		<>
			<StatusBar
				barStyle={darkModeHook ? "light-content" : "dark-content"}
				backgroundColor={darkModeHook ? "black" : "white"}
				animated
			/>
			<NavigationContainer
				ref={navigationRef}
				theme={{
					...DefaultTheme,
					colors: {
						...DefaultTheme.colors,
						primary: theme.colors.themePurple,
						text: theme.colors.text,
						background: theme.colors.themeBackground,
						card: theme.colors.contentBackground,
						border: darkModeHook ? "white" : DefaultTheme.colors.border,
					},
				}}>
				{appLocked === true ? (
					<DigitalPasswordScreen
						navigation={undefined}
						// @ts-ignore
						route={{params: {action: "verify"}}}
					/>
				) : (
					<Root />
				)}
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
