import "./utils/extensions";
import {Provider, useDispatch, useSelector} from "react-redux";
import {navigationRef, persistor, State, store} from "./redux/store";
import {PersistGate} from "redux-persist/integration/react";
import {useEffect} from "react";
import {DefaultTheme, NavigationContainer} from "@react-navigation/native";
import {Alert, StatusBar, useColorScheme} from "react-native";
import themes from "./assets/themes/themes";
import {checkBroadcast, checkUpdate} from "./utils/checkUpdate";
import {configSet} from "./redux/slices/config";
import {DigitalPasswordScreen} from "./ui/settings/digitalPassword";
import {Root} from "./components/Root";

const RootComponent = () => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	const dark = useSelector((s: State) => s.config.darkMode);
	const darkModeHook = dark || themeName === "dark";

	const appLocked = useSelector((s: State) => s.config.appLocked);
	const beta3Notified = useSelector((s: State) => s.config.beta3Notified);
	const dispatch = useDispatch();

	useEffect(() => {
		checkUpdate();
		checkBroadcast();
		if (beta3Notified !== true) {
			Alert.alert(
				"公测提示",
				"公测版虽已排除大部分问题，但并非稳定版。\n参与公测即表示您自愿接受软件错误导致的潜在风险。\n如有问题请及时反馈。",
				[
					{
						text: "确定",
						onPress: () =>
							dispatch(configSet({key: "beta3Notified", value: true})),
					},
				],
				{cancelable: false},
			);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
