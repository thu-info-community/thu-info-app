import {Provider} from "react-redux";
import {persistor, store} from "./redux/store";
import {PersistGate} from "redux-persist/integration/react";
import React from "react";
import {AuthFlow} from "./components/AuthFlow";
import {NavigationContainer} from "@react-navigation/native";
import {ThemeContext} from "./assets/themes/context";
import {MenuProvider} from "react-native-popup-menu";

export const App = () => (
	<Provider store={store}>
		<ThemeContext.Provider value={"light"}>
			<MenuProvider>
				<PersistGate persistor={persistor}>
					<NavigationContainer>
						<AuthFlow />
					</NavigationContainer>
				</PersistGate>
			</MenuProvider>
		</ThemeContext.Provider>
	</Provider>
);
