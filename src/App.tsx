import {Provider} from "react-redux";
import {persistor, store} from "./redux/store";
import {PersistGate} from "redux-persist/integration/react";
import React from "react";
import {AuthFlow} from "./components/AuthFlow";
import {DefaultTheme, NavigationContainer} from "@react-navigation/native";
import {MenuProvider} from "react-native-popup-menu";
import {AppearanceProvider} from "react-native-appearance";
import {useColorScheme} from "react-native-appearance";

export const App = () => (
	<Provider store={store}>
		<AppearanceProvider>
			<MenuProvider>
				<PersistGate persistor={persistor}>
					<NavigationContainer
						theme={{
							...DefaultTheme,
							colors: {
								...DefaultTheme.colors,
								text: useColorScheme() === "dark" ? "white" : "black",
								background: useColorScheme() === "dark" ? "black" : "white",
								card: useColorScheme() === "dark" ? "black" : "white",
								border: useColorScheme() === "dark" ? "white" : "black",
							},
						}}>
						<AuthFlow />
					</NavigationContainer>
				</PersistGate>
			</MenuProvider>
		</AppearanceProvider>
	</Provider>
);
