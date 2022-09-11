import React from "react";
import {RootNav} from "../../components/Root";
import {useColorScheme, View} from "react-native";
import {SecondaryItem, styles} from "../../components/home/secondaryItems";
import IconExpenditure from "../../assets/icons/IconExpenditure";
import IconBankPayment from "../../assets/icons/IconBankPayment";
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
				{!disabledFunction.includes("expenditure") && (
					<SecondaryItem
						title="expenditure"
						destKey="expenditure"
						icon={<IconExpenditure />}
						onPress={() => {
							addUsageStat(FunctionType.Expenditures);
							navigation.navigate("Expenditure");
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
				{!disabledFunction.includes("invoice") && (
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
			</View>
		</View>
	);
};
