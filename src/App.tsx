import "./utils/extensions";
import {Provider} from "react-redux";
import {persistor, store} from "./redux/store";
import {PersistGate} from "redux-persist/integration/react";
import React from "react";
import {AuthFlow} from "./components/AuthFlow";
import {DefaultTheme, NavigationContainer} from "@react-navigation/native";
import {useColorScheme} from "react-native";
import themes from "./assets/themes/themes";

export const App = () => (
	<Provider store={store}>
		<PersistGate persistor={persistor}>
			<NavigationContainer
				theme={{
					...DefaultTheme,
					colors: {
						...DefaultTheme.colors,
						text: themes(useColorScheme()).colors.text,
						background: themes(useColorScheme()).colors.background,
						card: themes(useColorScheme()).colors.background,
						border:
							useColorScheme() === "dark"
								? "white"
								: DefaultTheme.colors.border,
					},
				}}>
				<AuthFlow />
			</NavigationContainer>
		</PersistGate>
	</Provider>
);
