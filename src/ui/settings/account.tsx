import {getStr} from "../../utils/i18n";
import {State} from "../../redux/store";
import {useSelector} from "react-redux";
import {Text, TouchableOpacity, useColorScheme, View} from "react-native";
import {RootNav} from "../../components/Root";
import {RoundedView} from "../../components/views";
import IconRight from "../../assets/icons/IconRight";
import {styles} from "./settings";

export const AccountScreen = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);

	const userId = useSelector((s: State) => s.auth.userId);
	const appSecret = useSelector((s: State) => s.credentials.appSecret);

	return (
		<View style={{flex: 1, padding: 12}}>
			<RoundedView style={style.rounded}>
				<View style={style.touchable}>
					<Text style={style.text}>{getStr("infoAccount")}</Text>
					<Text style={style.version}>{userId}</Text>
				</View>
			</RoundedView>
			<RoundedView style={style.rounded}>
				<TouchableOpacity
					style={style.touchable}
					onPress={() => {
						if (appSecret === undefined) {
							navigation.navigate("AppSecret");
						} else {
							navigation.navigate("DigitalPassword", {
								action: "verify",
								target: "AppSecret",
							});
						}
					}}>
					<Text style={style.text}>{getStr("appSecret")}</Text>
					<View style={{flexDirection: "row", alignItems: "center"}}>
						<Text style={style.version}>
							{getStr(appSecret === undefined ? "notConfigured" : "configured")}
						</Text>
						<IconRight height={20} width={20} />
					</View>
				</TouchableOpacity>
			</RoundedView>
		</View>
	);
};
