import React from "react";
import {RootNav} from "../../components/Root";
import {useColorScheme, View} from "react-native";
import {SecondaryItem, styles} from "../../components/home/secondaryItems";
import IconExpenditure from "../../assets/icons/IconExpenditure";
import IconBankPayment from "../../assets/icons/IconBankPayment";
import IconInvoice from "../../assets/icons/IconInvoice";

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
						navigation.navigate("Expenditure");
					}}
				/>
				<SecondaryItem
					title="bankPayment"
					destKey="bankPayment"
					icon={<IconBankPayment />}
					onPress={() => {
						navigation.navigate("BankPayment");
					}}
				/>
				<SecondaryItem
					title="invoice"
					destKey="invoice"
					icon={<IconInvoice />}
					onPress={() => {
						navigation.navigate("Invoice");
					}}
				/>
			</View>
		</View>
	);
};
