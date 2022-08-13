import React, {useEffect, useState} from "react";
import {getStr} from "../../utils/i18n";
import {globalObjects, State} from "../../redux/store";
import {Text, TouchableOpacity, useColorScheme, View} from "react-native";
import {RoundedView} from "../../components/views";
import {connect} from "react-redux";
import {styles} from "./settings";
import IconCheck from "../../assets/icons/IconCheck";

export const LanguageUI = (props: {language: string}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);

	const [language, setLanguage] = useState(props.language);

	useEffect(() => {
		if (language === "zh") {
			globalObjects.languageSelected = "zh";
		} else if (language === "en") {
			globalObjects.languageSelected = "en";
		} else {
			globalObjects.languageSelected = "auto";
		}
	}, [language]);

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
