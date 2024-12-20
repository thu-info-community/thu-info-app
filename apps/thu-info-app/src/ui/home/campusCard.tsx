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
					setMoney("");
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
			</ScrollView>
		</KeyboardAvoidingView>
	);
};
