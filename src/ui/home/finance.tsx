import React from "react";
import {RootNav} from "../../components/Root";
import {useColorScheme, View} from "react-native";
import {SecondaryItem, styles} from "../../components/home/secondaryItems";
import IconExpenditure from "../../assets/icons/IconExpenditure";
import IconBankPayment from "../../assets/icons/IconBankPayment";
import IconInvoice from "../../assets/icons/IconInvoice";
import {addUsageStat, FunctionType} from "../../utils/webApi";

export const FinanceScreen = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	return (
		<View style={style.SecondaryRootView}>
			<View style={style.SecondaryContentView}>
				<SecondaryItem
					title="expenditure"
					destKey="expenditure"
					icon={<IconExpenditure />}
					onPress={() => {
						addUsageStat(FunctionType.Expenditures);
						navigation.navigate("Expenditure");
					}}
				/>
				<SecondaryItem
					title="bankPayment"
					destKey="bankPayment"
					icon={<IconBankPayment />}
					onPress={() => {
						addUsageStat(FunctionType.Bank);
						navigation.navigate("BankPayment");
					}}
				/>
				<SecondaryItem
					title="invoice"
					destKey="invoice"
					icon={<IconInvoice />}
					onPress={() => {
						addUsageStat(FunctionType.Invoice);
						navigation.navigate("Invoice");
					}}
				/>
			</View>
		</View>
	);
};
