import Alipay from "../../utils/alipay";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import React, {useState} from "react";
import {Modal, Text, TextInput, TouchableOpacity, View} from "react-native";

export const AlipayPopup = ({
	onPay,
	title,
}: {
	onPay: (money: number) => Promise<any>;
	title: React.ReactNode;
}) => {
	const [popup, setPopup] = useState(false);
	const [money, setMoney] = useState("");
	const [processing, setProcessing] = useState(false);

	const regRes = /\d+/.exec(money);
	const valid = regRes && regRes.length > 0 && regRes[0] === money;

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
							backgroundColor: "white",
							padding: 25,
						}}>
						<View style={{flexDirection: "row", alignItems: "center"}}>
							<Text>￥</Text>
							<TextInput
								keyboardType="numeric"
								placeholder="0"
								value={money}
								onChangeText={setMoney}
								editable={!processing}
								style={{fontSize: 27, width: "90%"}}
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
									Alipay.exists()
										.then(() => {
											setProcessing(true);
											onPay(Number(money))
												.then(close)
												.catch(() =>
													Snackbar.show({
														text: getStr("payFailure"),
														duration: Snackbar.LENGTH_INDEFINITE,
														action: {text: getStr("ok")},
													}),
												);
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
							<Text style={{color: processing ? "grey" : "black"}}>
								{getStr("cancelPayment")}
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
			<TouchableOpacity
				style={{padding: 10}}
				onPress={() => {
					setPopup(true);
				}}>
				<Text>{title}</Text>
			</TouchableOpacity>
		</>
	);
};
