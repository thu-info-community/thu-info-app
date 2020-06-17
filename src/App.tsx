import {Provider} from "react-redux";
import {persistor, store} from "./redux/store";
import {PersistGate} from "redux-persist/integration/react";
import React from "react";
import {AuthFlow} from "./components/AuthFlow";
import {NavigationContainer} from "@react-navigation/native";

export const App = () => (
	<Provider store={store}>
		<PersistGate persistor={persistor}>
			<NavigationContainer>
				<AuthFlow />
			</NavigationContainer>
		</PersistGate>
	</Provider>
);
