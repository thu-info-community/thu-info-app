import {
	SettingsItem,
	SettingsDoubleText,
} from "../../components/settings/items";
import {getStr} from "../../utils/i18n";
import React, {useEffect, useState} from "react";
import Feather from "react-native-vector-icons/Feather";
import {Text, TextInput, TouchableOpacity, View} from "react-native";
import {RootNav} from "../../components/Root";
import {helper} from "../../redux/store";
import {doAlipay, hasAlipay} from "../../utils/alipay";
import {useColorScheme} from "react-native";
import themes from "../../assets/themes/themes";
import Snackbar from "react-native-snackbar";
import {DormAuthError} from "thu-info-lib/dist/utils/error";

export const ElectricityScreen = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const [money, setMoney] = useState("");
	const [processing, setProcessing] = useState(false);

	const [remainderValue, setRemainderValue] = useState<number>(Number.NaN);
	const [remainderStatus, setRemainderStatus] = useState<
		"loading" | "done" | "error"
	>("loading");

	const regRes = /\d+/.exec(money);
	const valid =
		regRes && regRes.length > 0 && regRes[0] === money && Number(money) <= 42;

	const getRemainder = () => {
		setRemainderStatus("loading");
		helper
			.getEleRemainder()
			.then((remainder) => {
				setRemainderValue(remainder);
				setRemainderStatus("done");
			})
			.catch((e) => {
				setRemainderStatus("error");
				if (e instanceof DormAuthError) {
					navigation.navigate("MyhomeLogin");
				}
			});
	};

	useEffect(() => {
		getRemainder();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<View style={{padding: 10, flex: 1}}>
			<SettingsItem
				text={getStr("eleRecord")}
				onPress={() => navigation.navigate("EleRecord")}
				icon={<Feather name="zap" size={16} />}
			/>
			<SettingsDoubleText
				textLeft={getStr("eleRemainder")}
				textRight={(() => {
					switch (remainderStatus) {
						case "loading":
							return getStr("loading");
						case "done":
							return `${remainderValue} ${getStr("kwh")}`;
						case "error":
							return getStr("loadFail");
					}
				})()}
				onPress={() => remainderStatus !== "loading" && getRemainder()}
				icon={<Feather name="zap" size={16} />}
			/>
			{!helper.mocked() && (
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
								backgroundColor: colors.themeBackground,
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
			)}
		</View>
	);
};
