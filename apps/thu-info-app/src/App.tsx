import "./utils/extensions";
import {Provider, useDispatch, useSelector} from "react-redux";
import {navigationRef, persistor, State, store} from "./redux/store";
import {PersistGate} from "redux-persist/integration/react";
import {useEffect, useRef} from "react";
import {
	DefaultTheme,
	NavigationContainer,
	NavigationContainerRef,
} from "@react-navigation/native";
import {Alert, Dimensions, StatusBar, useColorScheme} from "react-native";
import themes from "./assets/themes/themes";
import {configSet} from "./redux/slices/config";
import {DigitalPasswordScreen} from "./ui/settings/digitalPassword";
import {Root} from "./components/Root";
import {getStr} from "./utils/i18n";
import {SplitViewProvider} from "./components/SplitView";
import DeviceInfo from "react-native-device-info";

const RootComponent = () => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	const dark = useSelector((s: State) => s.config.darkMode);
	const darkModeHook = dark || themeName === "dark";

	const appLocked = useSelector((s: State) => s.config.appLocked);
	const studentNotified = useSelector((s: State) => s.config.studentNotified);
	const tabletMode = useSelector((s: State) => s.config.tabletMode);
	const dispatch = useDispatch();

	const detailNavigationContainerRef = useRef<NavigationContainerRef<{}>>(null);

	const windowWidth = Dimensions.get("window").width;

	useEffect(() => {
		if (studentNotified !== true) {
			Alert.alert(
				"有问题？Help!",
				"该应用由学生自主开发，难免有设计不周之处。应用内提供了反馈问题的渠道，如有建议或意见，请畅所欲言！\n\n" +
					"This APP is developed by a team of students. If you have any questions, do not hesitate to ask us in the feedback section of this APP. We shall be quick to respond!",
				[
					{
						text: getStr("ok"),
						onPress: () =>
							dispatch(configSet({key: "studentNotified", value: true})),
					},
				],
				{cancelable: false},
			);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const showDetail = windowWidth >= 750;

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
				<SplitViewProvider
					splitEnabled={(tabletMode ?? false) && DeviceInfo.isTablet()}
					detailNavigationContainerRef={
						showDetail ? detailNavigationContainerRef : null
					}
					showDetail={showDetail}>
					{appLocked === true ? (
						<DigitalPasswordScreen
							navigation={undefined}
							// @ts-ignore
							route={{params: {action: "verify"}}}
						/>
					) : (
						<Root showRootTabs={true} />
					)}
					<NavigationContainer
						independent
						ref={detailNavigationContainerRef}
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
						<Root showRootTabs={false} />
					</NavigationContainer>
				</SplitViewProvider>
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
