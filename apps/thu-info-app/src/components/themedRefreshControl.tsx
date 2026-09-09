import {ComponentProps, ComponentPropsWithRef} from "react";
import {RefreshControl, useColorScheme} from "react-native";
import {RefreshControl as GestureRefreshControl} from "react-native-gesture-handler";
import {useSelector} from "react-redux";
import themes from "../assets/themes/themes";
import {State} from "../redux/store";

const useRefreshControlColors = () => {
	const systemTheme = useColorScheme();
	const darkMode = useSelector((state: State) => state.config.darkMode);
	const {colors} = themes(darkMode ? "dark" : systemTheme);
	return {
		tintColor: colors.themePurple,
		colors: [colors.themePurple],
		progressBackgroundColor: colors.contentBackground,
	};
};

export const ThemedRefreshControl = (
	props: ComponentPropsWithRef<typeof RefreshControl>,
) => {
	const colors = useRefreshControlColors();
	return <RefreshControl {...colors} {...props} />;
};

export const ThemedGestureRefreshControl = (
	props: ComponentProps<typeof GestureRefreshControl>,
) => {
	const colors = useRefreshControlColors();
	return <GestureRefreshControl {...colors} {...props} />;
};
