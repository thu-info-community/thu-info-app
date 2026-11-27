import themes, {Theme} from "../assets/themes/themes";
import {ImageStyle, StyleSheet, TextStyle, ViewStyle} from "react-native";

type NamedStyles<T> = {[P in keyof T]: ViewStyle | TextStyle | ImageStyle};

export default <T extends NamedStyles<T> | NamedStyles<any>>(
		styleCreator: (theme: Theme) => T,
	) =>
	(theme: string | undefined | null): T =>
		StyleSheet.create<T>(styleCreator(themes(theme)));
