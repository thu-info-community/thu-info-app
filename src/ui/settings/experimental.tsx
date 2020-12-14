import {SettingsItem, SettingsSeparator} from "../../components/settings/items";
import {getStr} from "../../utils/i18n";
import React from "react";
import Feather from "react-native-vector-icons/Feather";
import {Text, View} from "react-native";
import {performLoseCard} from "../../components/home/loseCard";
import {SettingsNav} from "./settingsStack";
import {mocked} from "../../redux/store";
import {AlipayPopup} from "../../components/home/alipayPopup";
import {getEleRechargePayCode} from "../../network/dorm";
import {doAlipay} from "../../utils/alipay";

export const ExperimentalScreen = ({navigation}: {navigation: SettingsNav}) => (
	<View style={{padding: 10}}>
		<Text style={{padding: 8, textAlign: "center"}}>
			{getStr("experimentalHint")}
		</Text>
		<SettingsItem
			text={getStr("loseCard")}
			onPress={performLoseCard}
			icon={<Feather name="credit-card" size={16} />}
		/>
		<SettingsSeparator />
		{!mocked() && (
			<AlipayPopup
				onPay={(money) => getEleRechargePayCode(money).then(doAlipay)}
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
	</View>
);
