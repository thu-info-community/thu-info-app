import React, {useLayoutEffect, useState} from "react";
import {getStr} from "../../utils/i18n";
import {helper, State, store} from "../../redux/store";
import {Text, TouchableOpacity, useColorScheme, View} from "react-native";
import {RoundedView} from "../../components/views";
import {connect} from "react-redux";
import {styles} from "./settings";
import IconCheck from "../../assets/icons/IconCheck";
import {RootNav} from "../../components/Root";
import {configSet} from "../../redux/slices/config";
import Snackbar from "react-native-snackbar";
import themes from "../../assets/themes/themes";

export const LanguageUI = (props: {language: string; navigation: RootNav}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	const {colors} = themes(themeName);

	const [language, setLanguage] = useState(props.language);

	useLayoutEffect(() => {
		props.navigation.setOptions({
			headerRight: () => (
				<TouchableOpacity
					style={{paddingHorizontal: 16, margin: 4}}
					onPress={() => {
						props.navigation.pop();
						store.dispatch(configSet({key: "language", value: language}));
						Snackbar.show({
							text: getStr("restartToApply"),
							duration: Snackbar.LENGTH_SHORT,
						});
						if (language === "auto") {
							helper.switchLang(getStr("mark") === "CH" ? "zh" : "en");
						} else {
							helper.switchLang(language as "zh" | "en");
						}
					}}>
					<Text style={{color: colors.primaryLight, fontSize: 16}}>
						{getStr("done")}
					</Text>
				</TouchableOpacity>
			),
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.navigation, language]);

	return (
		<View style={{flex: 1, padding: 12}}>
			<RoundedView style={style.rounded}>
				<TouchableOpacity
					style={style.touchable}
					onPress={() => setLanguage("auto")}>
					<Text style={style.text}>{getStr("autoFollow")}</Text>
					{language !== "zh" && language !== "en" && (
						<IconCheck width={18} height={18} />
					)}
				</TouchableOpacity>
				<View style={style.separator} />
				<TouchableOpacity
					style={style.touchable}
					onPress={() => setLanguage("zh")}>
					<Text style={style.text}>简体中文</Text>
					{language === "zh" && <IconCheck width={18} height={18} />}
				</TouchableOpacity>
				<View style={style.separator} />
				<TouchableOpacity
					style={style.touchable}
					onPress={() => setLanguage("en")}>
					<Text style={style.text}>English</Text>
					{language === "en" && <IconCheck width={18} height={18} />}
				</TouchableOpacity>
			</RoundedView>
		</View>
	);
};

export const LanguageScreen = connect((state: State) => ({
	...state.config,
}))(LanguageUI);
