import {RootNav} from "../../components/Root";
import {Platform, useColorScheme, View} from "react-native";
import {SecondaryItem, styles} from "../../components/home/secondaryItems";
import IconExpenditure from "../../assets/icons/IconExpenditure";
import IconBankPayment from "../../assets/icons/IconBankPayment";
import IconIncome from "../../assets/icons/IconIncome.tsx";
import IconInvoice from "../../assets/icons/IconInvoice";
import {addUsageStat, FunctionType} from "../../utils/webApi";
import {currState} from "../../redux/store";

export const FinanceScreen = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	const disabledFunction = currState().config.homeFunctionDisabled;
	return (
		<View style={style.SecondaryRootView}>
			<View style={style.SecondaryContentView}>
				{!disabledFunction.includes("campusCard") && (
					<SecondaryItem
						title="campusCard"
						destKey="campusCard"
						icon={<IconExpenditure />}
						onPress={() => {
							addUsageStat(FunctionType.CampusCard);
							navigation.navigate("CampusCard");
						}}
					/>
				)}
				{!disabledFunction.includes("bankPayment") && (
					<SecondaryItem
						title="bankPayment"
						destKey="bankPayment"
						icon={<IconBankPayment />}
						onPress={() => {
							addUsageStat(FunctionType.Bank);
							navigation.navigate("BankPayment");
						}}
					/>
				)}
				{(!disabledFunction.includes("invoice") && (Platform.OS === "android" || Platform.OS === "ios")) && (
					<SecondaryItem
						title="invoice"
						destKey="invoice"
						icon={<IconInvoice />}
						onPress={() => {
							addUsageStat(FunctionType.Invoice);
							navigation.navigate("Invoice");
						}}
					/>
				)}
				{!disabledFunction.includes("income") && (
					<SecondaryItem
						title="graduateIncome"
						destKey="income"
						icon={<IconIncome />}
						onPress={() => {
							addUsageStat(FunctionType.Income);
							navigation.navigate("Income");
						}}
					/>
				)}
			</View>
		</View>
	);
};
