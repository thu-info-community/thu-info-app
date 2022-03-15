import {
	SettingsItem,
	SettingsSetPassword,
} from "../../components/settings/items";
import {getStr} from "../../utils/i18n";
import React, {useState} from "react";
import Feather from "react-native-vector-icons/Feather";
import {Text, TextInput, TouchableOpacity, View} from "react-native";
import {HomeNav} from "./homeStack";
import {helper} from "../../redux/store";
import {doAlipay, hasAlipay} from "../../utils/alipay";
import {useColorScheme} from "react-native";
import themes from "../../assets/themes/themes";
import Snackbar from "react-native-snackbar";
import {NetworkRetry} from "../../components/easySnackbars";
import {connect} from "react-redux";
import {setDormPasswordAction} from "../../redux/actions/credentials";
import {roam} from "thu-info-lib/dist/lib/core";

const ElectricityUI = ({
	setDormPassword,
	navigation,
}: {
	setDormPassword: (newToken: string) => void;
	navigation: HomeNav;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const [money, setMoney] = useState("");
	const [processing, setProcessing] = useState(false);

	const regRes = /\d+/.exec(money);
	const valid =
		regRes && regRes.length > 0 && regRes[0] === money && Number(money) <= 42;

	return (
		<View style={{padding: 10, flex: 1}}>
			<Text style={{padding: 8, textAlign: "center", color: colors.text}}>
				{getStr("experimentalHint")}
			</Text>
			{!helper.mocked() && (
				<SettingsSetPassword
					text={getStr("homePassword")}
					onValueChange={setDormPassword}
					validator={(newPassword) =>
						new Promise((resolve) => {
							helper.dormPassword = newPassword;
							helper
								.logout()
								.then(() => helper.login({}))
								.then(() => roam(helper, "myhome", ""))
								.then(() => resolve(true))
								.catch(() => resolve(false));
						})
					}
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
			<View style={{flex: 1}} />
			<View
				style={{
					justifyContent: "center",
					alignItems: "center",
					padding: 25,
				}}>
				<Text style={{fontSize: 17, color: colors.text}}>
					{getStr("eleRecharge")}
				</Text>
				<View style={{flexDirection: "row", alignItems: "center"}}>
					<Text style={{color: colors.text}}>￥</Text>
					<TextInput
						keyboardType="numeric"
						placeholder="0"
						value={money}
						onChangeText={setMoney}
						editable={!processing}
						style={{
							fontSize: 27,
							width: "90%",
							color: colors.text,
							backgroundColor: colors.background,
						}}
					/>
				</View>
				<TouchableOpacity
					style={{
						backgroundColor: valid ? "#128FEC" : "#6CB7EE",
						margin: 20,
						height: 40,
						width: "100%",
						alignItems: "center",
						justifyContent: "center",
					}}
					disabled={!valid || processing}
					onPress={() => {
						valid &&
							!processing &&
							hasAlipay()
								.then(() => {
									setProcessing(true);
									helper
										.getEleRechargePayCode(Number(money))
										.then(doAlipay)
										.then(() => {
											setProcessing(false);
											setMoney("");
										})
										.catch(() => {
											Snackbar.show({
												text: getStr("payFailure"),
												duration: Snackbar.LENGTH_INDEFINITE,
												action: {text: getStr("ok")},
											});
											setProcessing(false);
										});
								})
								.catch(() =>
									Snackbar.show({
										text: getStr("alipayRequired"),
										duration: Snackbar.LENGTH_SHORT,
									}),
								);
					}}>
					<Text
						style={{
							color: valid && !processing ? "white" : "#C3E3FA",
							fontSize: 18,
						}}>
						{getStr(processing ? "processing" : "payWithAlipay")}
					</Text>
				</TouchableOpacity>
				<Text style={{textAlign: "left", color: "red"}}>
					{getStr("eleRechargeHint")}
				</Text>
			</View>
		</View>
	);
};

export const ElectricityScreen = connect(undefined, (dispatch) => ({
	setDormPassword: (password: string) =>
		dispatch(setDormPasswordAction(password)),
}))(ElectricityUI);
