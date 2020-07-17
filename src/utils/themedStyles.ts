import themes, {Theme} from "../assets/themes/themes";
import {ImageStyle, StyleSheet, TextStyle, ViewStyle} from "react-native";

type NamedStyles<T> = {[P in keyof T]: ViewStyle | TextStyle | ImageStyle};

type validThemes = keyof typeof themes;

export default <T extends NamedStyles<T> | NamedStyles<any>>(
	styleCreator: (theme: Theme) => T | NamedStyles<T>,
) => {
	const m = new Map<validThemes, T>(
		Object.keys(themes).map((theme) => [
			theme as validThemes,
			StyleSheet.create(styleCreator(themes[theme as validThemes])),
		]),
	);
	return (theme: validThemes): T =>
		m.get(theme) || StyleSheet.create(styleCreator(themes.light));
};
