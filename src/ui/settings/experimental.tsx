import {SettingsItem} from "../../components/settings/items";
import {getStr} from "../../utils/i18n";
import React from "react";
import Feather from "react-native-vector-icons/Feather";
import {View} from "react-native";
import {performLoseCard} from "../../components/home/loseCard";

export const ExperimentalScreen = () => (
	<View style={{padding: 10}}>
		<SettingsItem
			text={getStr("loseCard")}
			onPress={performLoseCard}
			icon={<Feather name="credit-card" size={16} />}
		/>
	</View>
);
