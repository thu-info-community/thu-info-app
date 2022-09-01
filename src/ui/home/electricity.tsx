import {getStr} from "../../utils/i18n";
import React, {useEffect, useState} from "react";
import {
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import {helper} from "../../redux/store";
import {doAlipay, hasAlipay} from "../../utils/alipay";
import {useColorScheme} from "react-native";
import themes from "../../assets/themes/themes";
import Snackbar from "react-native-snackbar";
import {RoundedView} from "../../components/views";
import IconRefresh from "../../assets/icons/IconRefresh";

export const ElectricityScreen = () => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const [money, setMoney] = useState("");
	const [processing, setProcessing] = useState(false);
	const [moneyQuickSelected, setMoneyQuickSelected] = useState<
		number | undefined
	>();

	const [remainderValue, setRemainderValue] = useState<number>(Number.NaN);
	const [remainderStatus, setRemainderStatus] = useState<
		"loading" | "done" | "error"
	>("loading");
	const [updateTimeValue, setUpdateTimeValue] = useState<string | undefined>();

	const regRes = /\d+/.exec(money);
	const valid =
		regRes && regRes.length > 0 && regRes[0] === money && Number(money) <= 42;

	const getRemainder = () => {
		setRemainderStatus("loading");
		helper
			.getEleRemainder()
			.then(({remainder, updateTime}) => {
				setRemainderValue(remainder);
				setRemainderStatus("done");
				setUpdateTimeValue(updateTime);
			})
			.catch(() => setRemainderStatus("error"));
	};

	useEffect(() => {
		getRemainder();
	}, []);

	return (
		<ScrollView style={{paddingHorizontal: 12, paddingVertical: 16, flex: 1}}>
			<RoundedView
				style={{
					paddingVertical: 12,
					alignItems: "center",
					justifyContent: "center",
				}}>
				<Text style={{color: colors.fontB3, fontSize: 11}}>
					{getStr("eleRemainder")}
				</Text>
				<Text style={{fontSize: 24, fontWeight: "600", color: colors.text}}>
					{(() => {
						switch (remainderStatus) {
							case "loading":
								return getStr("loading");
							case "done":
								return `${remainderValue} ${getStr("kwh")}`;
							case "error":
								return getStr("loadFail");
						}
					})()}
				</Text>
				<Text style={{color: colors.fontB3, fontSize: 11}}>
					{getStr("eleRemainderUpdateTime")}
					{updateTimeValue}
				</Text>
				<TouchableOpacity
					onPress={() => remainderStatus !== "loading" && getRemainder()}
					style={{position: "absolute", right: 12}}>
					<IconRefresh width={16} height={16} />
				</TouchableOpacity>
			</RoundedView>
			{!helper.mocked() && (
				<View
					style={{
						justifyContent: "center",
						alignItems: "center",
						marginTop: 24,
					}}>
					<Text
						style={{
							fontSize: 16,
							fontWeight: "600",
							color: colors.text,
							alignSelf: "flex-start",
							marginLeft: 12,
						}}>
						{getStr("eleRecharge")}
					</Text>
					<RoundedView style={{marginTop: 8, width: "100%", padding: 16}}>
						<View style={{flexDirection: "row"}}>
							{[10, 20, 30].map((price, index) => (
								<TouchableOpacity
									style={{
										borderRadius: 4,
										paddingHorizontal: 12,
										paddingVertical: 4,
										backgroundColor:
											moneyQuickSelected === price
												? colors.themePurple
												: colors.themeLightGrey,
										marginLeft: index === 0 ? 0 : 8,
									}}
									onPress={() => {
										setMoneyQuickSelected(price);
										setMoney(String(price));
									}}
									key={price}>
									<Text
										style={{
											color:
												moneyQuickSelected === price
													? colors.contentBackground
													: colors.fontB3,
										}}>
										{price} 元
									</Text>
								</TouchableOpacity>
							))}
						</View>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								marginTop: 16,
							}}>
							<Text style={{color: colors.text, fontSize: 20}}>￥</Text>
							<TextInput
								keyboardType="numeric"
								placeholder={getStr("enterEleRechargeValue")}
								value={money}
								onChangeText={(v) => {
									setMoney(v);
									setMoneyQuickSelected(undefined);
								}}
								editable={!processing}
								style={{
									padding: 0,
									fontSize: 20,
									marginLeft: 12,
									color: colors.text,
								}}
							/>
						</View>
						<View
							style={{
								borderWidth: 1,
								borderColor: colors.themeLightGrey,
								marginVertical: 12,
							}}
						/>
						<View style={{flexDirection: "row", justifyContent: "center"}}>
							<TouchableOpacity
								style={{
									backgroundColor: valid
										? colors.primaryLight
										: colors.mainTheme,
									alignItems: "center",
									justifyContent: "center",
									paddingVertical: 8,
									paddingHorizontal: 24,
									borderRadius: 4,
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
										color:
											valid && !processing
												? colors.contentBackground
												: colors.themeGrey,
										fontSize: 16,
									}}>
									{getStr(processing ? "processing" : "payForElectricity")}
								</Text>
							</TouchableOpacity>
						</View>
					</RoundedView>
					<Text
						style={{
							textAlign: "left",
							fontSize: 14,
							color: colors.fontB3,
							marginHorizontal: 16,
							marginTop: 32,
						}}>
						{getStr("eleRechargeHint")}
					</Text>
				</View>
			)}
		</ScrollView>
	);
};
