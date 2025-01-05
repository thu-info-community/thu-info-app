import {useEffect, useState} from "react";
import {
	Alert,
	KeyboardAvoidingView,
	Linking,
	Platform,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import themes from "../../assets/themes/themes";
import {helper, State} from "../../redux/store";
import {BottomPopupTriggerView, RoundedView} from "../../components/views";
import {useDispatch, useSelector} from "react-redux";
import {
	setBalance,
	setPaymentMethod,
	updateRechargeAmount,
} from "../../redux/slices/campusCard";
import IconRefresh from "../../assets/icons/IconRefresh";
import dayjs from "dayjs";
import {CardTransactionType} from "@thu-info/lib/src/models/card/transaction";
import {CardRechargeType} from "@thu-info/lib/src/models/card/recharge";
import IconDown from "../../assets/icons/IconDown";
import {RootNav} from "../../components/Root";
import { styles } from "../settings/settings";

export const CampusCardScreen = ({navigation}: {navigation: RootNav}) => {
	const dispatch = useDispatch();
	const {
		balance,
		updatedAt,
		paymentMethod,
		lastRechargeDate,
		todayRechargeAmount,
	} = useSelector((s: State) => s.campusCard);

	const [refreshing, setRefreshing] = useState(false);

	const [yesterdayExpenditure, setYesterdayExpenditure] = useState(0);
	const [todayExpenditure, setTodayExpenditure] = useState(0);

	const [money, setMoney] = useState("");
	const [processing, setProcessing] = useState(false);
	const [moneyQuickSelected, setMoneyQuickSelected] = useState<
		number | undefined
	>();

	// https://card.tsinghua.edu.cn/js/common/common.js
	const valid =
		/^(([1-9]+\d*)|0)(\.\d{0,2})?$/.test(money) &&
		Number(money) <= 200 &&
		Number(money) >= 10;

	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const style = styles(themeName);

	const refresh = () => {
		setRefreshing(true);
		helper
			.getCampusCardInfo()
			.then((cardInfo) => {
				dispatch(setBalance(cardInfo.balance));
			})
			.catch((e) => {
				Snackbar.show({
					text: getStr("networkRetry") + e,
					duration: Snackbar.LENGTH_SHORT,
				});
			})
			.then(() => {
				const todayDate = dayjs();
				const today = todayDate.format("YYYY-MM-DD");
				const yesterday = todayDate.add(-1, "day").format("YYYY-MM-DD");
				return Promise.all([
					helper.getCampusCardTransactions(
						yesterday,
						yesterday,
						CardTransactionType.Consumption,
					),
					helper.getCampusCardTransactions(
						today,
						today,
						CardTransactionType.Consumption,
					),
				]);
			})
			.then(([yesterdayTx, todayTx]) => {
				setYesterdayExpenditure(
					yesterdayTx.reduce((acc, tx) => acc + tx.amount, 0),
				);
				setTodayExpenditure(todayTx.reduce((acc, tx) => acc + tx.amount, 0));
			})
			.then(() => {
				setRefreshing(false);
			});
	};

	useEffect(refresh, [dispatch]);

	const performRecharge = () => {
		if (valid && !processing) {
			setProcessing(true);
			helper
				.rechargeCampusCard(
					Number(money),
					"",
					paymentMethod === "alipay"
						? CardRechargeType.Alipay
						: paymentMethod === "wechat"
						? CardRechargeType.Wechat
						: CardRechargeType.Bank,
				)
				.then((r) => {
					setProcessing(false);
					dispatch(
						updateRechargeAmount({
							amount: Number(money),
							date: dayjs().format("YYYY-MM-DD"),
						}),
					);
					Snackbar.show({
						text: getStr("rechargeSuccess"),
						duration: Snackbar.LENGTH_SHORT,
					});
					setMoney("");
					setMoneyQuickSelected(undefined);
					refresh();
					if (typeof r === "string") {
						Linking.openURL(r);
					}
				})
				.catch((e) => {
					Snackbar.show({
						text: getStr("network") + String(e),
						duration: Snackbar.LENGTH_INDEFINITE,
						action: {text: getStr("ok")},
					});
					setProcessing(false);
				});
		}
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={{flex: 1}}>
			<ScrollView style={{paddingHorizontal: 12, paddingVertical: 16, flex: 1}}>
				<RoundedView style={{margin: 12}}>
					<View style={{alignItems: "center", justifyContent: "center"}}>
						<View style={{alignItems: "center", flex: 1, padding: 5}}>
							<Text style={{color: colors.fontB2, fontSize: 11}}>
								{getStr("remainder")}
							</Text>
							<Text
								style={{fontSize: 24, fontWeight: "bold", color: colors.text}}>
								￥{balance.toFixed(2)}
							</Text>
						</View>
						<TouchableOpacity
							disabled={refreshing}
							onPress={() => !refreshing && refresh()}
							style={{position: "absolute", right: 12}}>
							<IconRefresh width={16} height={16} />
						</TouchableOpacity>
					</View>
					<TouchableOpacity
						onPress={() => {
							navigation.navigate("Expenditure");
						}}
						style={{
							marginVertical: 12,
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "center",
						}}>
						<View>
							<Text
								style={{
									color: colors.fontB2,
									fontSize: 11,
									textAlign: "center",
								}}>
								{getStr("yesterdayExpenditure")}
							</Text>
							<Text style={{fontSize: 18, color: colors.text, padding: 4}}>
								￥{yesterdayExpenditure.toFixed(2)}
							</Text>
						</View>
						<View
							style={{
								width: 1,
								height: 32,
								marginHorizontal: 32,
								backgroundColor: colors.themeGrey,
							}}
						/>
						<View>
							<Text
								style={{
									color: colors.fontB2,
									fontSize: 11,
									textAlign: "center",
								}}>
								{getStr("todayExpenditure")}
							</Text>
							<Text style={{fontSize: 18, color: colors.text, padding: 4}}>
								￥{todayExpenditure.toFixed(2)}
							</Text>
						</View>
					</TouchableOpacity>
					<View style={{alignItems: "center", justifyContent: "center"}}>
						<Text style={{color: colors.fontB3, fontSize: 11}}>
							{getStr("updateTime")}
							{dayjs(new Date(updatedAt)).format("YYYY-MM-DD HH:mm:ss")}
						</Text>
					</View>
				</RoundedView>
				{!helper.mocked() && (
					<View
						style={{
							justifyContent: "center",
							alignItems: "center",
							marginTop: 24,
							marginHorizontal: 12,
						}}>
						<Text
							style={{
								fontSize: 16,
								fontWeight: "600",
								color: colors.text,
								alignSelf: "flex-start",
								marginStart: 4,
							}}>
							{getStr("deposit")}
						</Text>
						<RoundedView style={{marginTop: 8, width: "100%", padding: 16}}>
							<View style={{flexDirection: "row"}}>
								{[10, 50, 100].map((price, index) => (
									<TouchableOpacity
										style={{
											borderRadius: 4,
											paddingHorizontal: 12,
											paddingVertical: 4,
											backgroundColor:
												moneyQuickSelected === price
													? colors.themePurple
													: colors.inputBorder,
											marginLeft: index === 0 ? 0 : 16,
										}}
										onPress={() => {
											setMoneyQuickSelected(price);
											setMoney(String(price));
										}}
										disabled={processing}
										key={price}>
										<Text
											style={{
												color:
													moneyQuickSelected === price
														? "#FFFFFF"
														: colors.fontB2,
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
									placeholder={getStr("enterDepositValue")}
									placeholderTextColor={colors.fontB3}
									value={money}
									onChangeText={(v) => {
										setMoney(v);
										setMoneyQuickSelected(Number(v));
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
									borderBottomWidth: 1,
									borderBottomColor: colors.themeGrey,
									marginVertical: 12,
								}}
							/>
							<View
								style={{flexDirection: "row", justifyContent: "space-between"}}>
								<Text style={{color: colors.fontB2}}>
									{getStr("paymentMethod")}
								</Text>
								<BottomPopupTriggerView
									popupTitle={getStr("selectPaymentMethod")}
									popupContent={(done) => (
										<View>
											<TouchableOpacity
												onPress={() => {
													dispatch(setPaymentMethod("bank"));
													done();
												}}>
												<Text
													style={{
														color: colors.text,
														padding: 16,
														fontSize: 16,
													}}>
													{getStr("bankTransfer")}
												</Text>
											</TouchableOpacity>
											<View
												style={[
													style.separator,
													{
														marginVertical: 0,
														marginHorizontal: 0,
													},
												]}
											/>
											<TouchableOpacity
												onPress={() => {
													dispatch(setPaymentMethod("alipay"));
													done();
												}}>
												<Text
													style={{
														color: colors.text,
														padding: 16,
														fontSize: 16,
													}}>
													{getStr("payViaAlipay")}
												</Text>
											</TouchableOpacity>
											<View
												style={[
													style.separator,
													{
														marginVertical: 0,
														marginHorizontal: 0,
													},
												]}
											/>
											<TouchableOpacity
												onPress={() => {
													dispatch(setPaymentMethod("wechat"));
													done();
												}}>
												<Text
													style={{
														color: colors.text,
														padding: 16,
														fontSize: 16,
													}}>
													{getStr("payViaWechat")}
												</Text>
											</TouchableOpacity>
											<View style={{height: 16}} />
										</View>
									)}
									popupCanFulfill={true}
									popupOnFulfilled={() => {}}
									popupOnCancelled={() => {}}>
									<View style={{flexDirection: "row", alignItems: "center"}}>
										<Text style={{color: colors.fontB2}}>
											{getStr(
												paymentMethod === "alipay"
													? "payViaAlipay"
													: paymentMethod === "wechat"
													? "payViaWechat"
													: "bankTransfer",
											)}
										</Text>
										<IconDown height={18} width={18} />
									</View>
								</BottomPopupTriggerView>
							</View>
							<View
								style={{
									flexDirection: "row",
									justifyContent: "center",
									marginTop: 24,
									marginBottom: 8,
								}}>
								<TouchableOpacity
									style={{
										backgroundColor: valid
											? colors.themePurple
											: colors.themeTransparentPurple,
										alignItems: "center",
										justifyContent: "center",
										paddingVertical: 8,
										paddingHorizontal: 24,
										borderRadius: 4,
									}}
									disabled={!valid || processing}
									onPress={() => {
										const today = dayjs().format("YYYY-MM-DD");
										if (today !== lastRechargeDate) {
											performRecharge();
										} else {
											if (todayRechargeAmount >= 400) {
												Alert.alert(
													getStr("warning"),
													getStr("depositExceedLimit"),
												);
											} else {
												Alert.alert(
													getStr("warning"),
													getStr("depositRepeatedWarning"),
													[
														{
															text: getStr("cancel"),
															style: "cancel",
														},
														{
															text: getStr("ok"),
															onPress: performRecharge,
														},
													],
												);
											}
										}
									}}>
									<Text
										style={{
											color:
												valid && !processing
													? "#FFFFFF"
													: colors.themeLightGrey,
											fontSize: 16,
										}}>
										{getStr(processing ? "processing" : "deposit")}
									</Text>
								</TouchableOpacity>
							</View>
						</RoundedView>
						<Text
							style={{
								textAlign: "left",
								fontSize: 14,
								color: colors.statusWarning,
								marginHorizontal: 4,
								marginTop: 32,
							}}>
							{getStr("depositHint")}
						</Text>
					</View>
				)}
			</ScrollView>
		</KeyboardAvoidingView>
	);
};
