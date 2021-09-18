import {hasAlipay} from "../../utils/alipay";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import React, {ReactElement, useState} from "react";
import {Modal, Text, TextInput, TouchableOpacity, View} from "react-native";
import {helper} from "../../redux/store";
import {useColorScheme} from "react-native";
import themes from "../../assets/themes/themes";

export const AlipayPopup = ({
	onPay,
	trigger,
}: {
	onPay: (money: number) => Promise<any>;
	trigger: (onPress: () => void) => ReactElement;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const [popup, setPopup] = useState(false);
	const [money, setMoney] = useState("");
	const [processing, setProcessing] = useState(false);

	const regRes = /\d+/.exec(money);
	const valid =
		regRes && regRes.length > 0 && regRes[0] === money && Number(money) <= 42;

	const close = () => {
		setProcessing(false);
		setMoney("");
		setPopup(false);
	};

	return (
		<>
			<Modal
				animationType="slide"
				transparent={true}
				visible={popup}
				onRequestClose={() => {}}>
				<View style={{flex: 1, justifyContent: "flex-end"}}>
					<View
						style={{
							justifyContent: "center",
							alignItems: "center",
							backgroundColor: colors.background,
							padding: 25,
						}}>
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
											onPay(Number(money))
												.then(close)
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
						<TouchableOpacity
							style={{padding: 8}}
							disabled={processing}
							onPress={() => !processing && close()}>
							<Text style={{color: processing ? "grey" : colors.text}}>
								{getStr("cancelPayment")}
							</Text>
						</TouchableOpacity>
						<Text style={{textAlign: "left", color: "red"}}>
							{getStr("eleRechargeHint")}
						</Text>
					</View>
				</View>
			</Modal>
			{trigger(() => {
				if (helper.mocked()) {
					Snackbar.show({
						text: getStr("testAccountNotSupportEleRecharge"),
						duration: Snackbar.LENGTH_SHORT,
					});
				} else {
					setPopup(true);
				}
			})}
		</>
	);
};
