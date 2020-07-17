import {Provider} from "react-redux";
import {persistor, store} from "./redux/store";
import {PersistGate} from "redux-persist/integration/react";
import React from "react";
import {AuthFlow} from "./components/AuthFlow";
import {NavigationContainer} from "@react-navigation/native";
import {ThemeContext} from "./assets/themes/context";

export const App = () => (
	<Provider store={store}>
		<ThemeContext.Provider value={"light"}>
			<PersistGate persistor={persistor}>
				<NavigationContainer>
					<AuthFlow />
				</NavigationContainer>
			</PersistGate>
		</ThemeContext.Provider>
	</Provider>
);
