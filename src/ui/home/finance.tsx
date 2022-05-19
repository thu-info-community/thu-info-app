import React from "react";
import {RootNav} from "../../components/Root";
import {useColorScheme, View} from "react-native";
import {
	SecondaryItem,
	secondaryItemIconSize,
	SecondaryItemSeparator,
	styles,
} from "../../components/home/secondaryItems";
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
					icon={
						<IconExpenditure
							width={secondaryItemIconSize}
							height={secondaryItemIconSize}
						/>
					}
					onPress={() => {
						navigation.navigate("Expenditure");
					}}
				/>
				<SecondaryItemSeparator />
				<SecondaryItem
					title="bankPayment"
					destKey="bankPayment"
					icon={
						<IconBankPayment
							width={secondaryItemIconSize}
							height={secondaryItemIconSize}
						/>
					}
					onPress={() => {
						navigation.navigate("BankPayment");
					}}
				/>
				<SecondaryItemSeparator />
				<SecondaryItem
					title="invoice"
					destKey="invoice"
					icon={
						<IconInvoice
							width={secondaryItemIconSize}
							height={secondaryItemIconSize}
						/>
					}
					onPress={() => {
						navigation.navigate("Invoice");
					}}
				/>
			</View>
		</View>
	);
};
