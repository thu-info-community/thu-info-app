import {SettingsItem, SettingsSeparator} from "../../components/settings/items";
import {getStr} from "../../utils/i18n";
import React from "react";
import Feather from "react-native-vector-icons/Feather";
import {Text, View} from "react-native";
import {performLoseCard} from "../../components/home/loseCard";
import {SettingsNav} from "./settingsStack";
import {helper} from "../../redux/store";
import {AlipayPopup} from "../../components/home/alipayPopup";
import {doAlipay} from "../../utils/alipay";
import {useColorScheme} from "react-native";
import themes from "../../assets/themes/themes";
import Snackbar from "react-native-snackbar";
import {NetworkRetry} from "../../components/easySnackbars";
import md5 from "md5";

export const ExperimentalScreen = ({navigation}: {navigation: SettingsNav}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<View style={{padding: 10}}>
			<Text style={{padding: 8, textAlign: "center", color: colors.text}}>
				{getStr("experimentalHint")}
			</Text>
			<SettingsItem
				text={getStr("loseCard")}
				onPress={performLoseCard}
				icon={<Feather name="credit-card" size={16} />}
			/>
			<SettingsSeparator />
			{!helper.mocked() && (
				<AlipayPopup
					onPay={(money) => helper.getEleRechargePayCode(money).then(doAlipay)}
					trigger={(onPress) => (
						<SettingsItem
							text={getStr("eleRecharge")}
							onPress={onPress}
							icon={<Feather name="zap" size={16} />}
						/>
					)}
				/>
			)}
			<SettingsItem
				text={getStr("eleRecord")}
				onPress={() => navigation.navigate("EleRecord")}
				icon={<Feather name="zap" size={16} />}
			/>
			<SettingsItem
				text={getStr("eleRemainder")}
				onPress={() => {
					Snackbar.show({
						text: getStr("processing"),
						duration: Snackbar.LENGTH_SHORT,
					});
					helper
						.getEleRemainder()
						.then((remainder) => {
							Snackbar.show({
								text: isNaN(remainder)
									? getStr("eleRemainderFail")
									: getStr("eleRemainderResult") + remainder,
								duration: Snackbar.LENGTH_LONG,
							});
						})
						.catch(NetworkRetry);
				}}
				icon={<Feather name="zap" size={16} />}
			/>
			<SettingsSeparator />
			{md5(helper.userId) === "c1b894ba0891b54456211a51e75ca487" && (
				<SettingsItem
					text={getStr("sportsBook")}
					onPress={() => navigation.navigate("SportsExp")}
					icon={<Feather name="activity" size={16} />}
				/>
			)}
		</View>
	);
};
