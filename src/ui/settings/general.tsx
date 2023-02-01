import {getStr} from "../../utils/i18n";
import {RootNav} from "../../components/Root";
import {State} from "../../redux/store";
import {Text, TouchableOpacity, useColorScheme, View} from "react-native";
import {RoundedView} from "../../components/views";
import IconRight from "../../assets/icons/IconRight";
import {useSelector} from "react-redux";
import {styles} from "./settings";

export const GeneralScreen = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);

	const darkMode = useSelector((s: State) => s.config.darkMode);
	const language = useSelector((s: State) => s.config.language);

	const colorString = getStr(darkMode === true ? "enable" : "autoFollow");

	const languageString =
		language === "zh"
			? "简体中文"
			: language === "en"
			? "English"
			: getStr("autoFollow");

	return (
		<View style={{flex: 1, padding: 12}}>
			<RoundedView style={style.rounded}>
				<TouchableOpacity
					style={style.touchable}
					onPress={() => navigation.navigate("DarkMode")}>
					<Text style={style.text}>{getStr("darkMode")}</Text>
					<View style={{flexDirection: "row", alignItems: "center"}}>
						<Text style={style.version}>{colorString}</Text>
						<IconRight height={20} width={20} />
					</View>
				</TouchableOpacity>
			</RoundedView>
			<RoundedView style={style.rounded}>
				<TouchableOpacity
					style={style.touchable}
					onPress={() => navigation.navigate("Language")}>
					<Text style={style.text}>{getStr("language")}</Text>
					<View style={{flexDirection: "row", alignItems: "center"}}>
						<Text style={style.version}>{languageString}</Text>
						<IconRight height={20} width={20} />
					</View>
				</TouchableOpacity>
			</RoundedView>
		</View>
	);
};
