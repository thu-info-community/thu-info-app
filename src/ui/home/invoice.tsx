import React, {PropsWithChildren} from "react";
import {
	Dimensions,
	GestureResponderEvent,
	Platform,
	Text,
	TouchableHighlight,
	TouchableNativeFeedback,
	View,
} from "react-native";
import themes from "../../assets/themes/themes";
import {helper} from "../../redux/store";
import {useColorScheme} from "react-native";
import {Invoice} from "thu-info-lib/dist/models/home/invoice";
import {paginatedRefreshListScreen} from "../../components/settings/paginatedRefreshListScreen";
import {HomeNav} from "./homeStack";
import {getStr} from "src/utils/i18n";

const InvoiceItem = ({
	invoice,
	onPress,
}: {
	invoice: Invoice;
	onPress: (event: GestureResponderEvent) => void;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const content = (
		<View style={{padding: 8}}>
			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-between",
				}}>
				<View
					style={{flexDirection: "column", flex: 3, alignItems: "flex-start"}}>
					<Text style={{fontSize: 13, marginHorizontal: 10, color: "grey"}}>
						{invoice.inv_no}
					</Text>
					<Text
						style={{fontSize: 17, marginHorizontal: 10, color: colors.text}}>
						{invoice.financial_item_name}
					</Text>
					<Text style={{fontSize: 14, marginHorizontal: 10, color: "grey"}}>
						{invoice.financial_dept_name}/{invoice.payment_item_type_name}
					</Text>
				</View>
				<View
					style={{flexDirection: "column", flex: 1, alignItems: "flex-end"}}>
					<Text style={{fontSize: 18, marginHorizontal: 6, color: colors.text}}>
						{invoice.inv_amount}
					</Text>
					<Text style={{fontSize: 12, marginHorizontal: 6, color: "grey"}}>
						{invoice.inv_date}
					</Text>
				</View>
			</View>
			<Text style={{fontSize: 14, marginHorizontal: 10, color: "grey"}}>
				{invoice.inv_note}
			</Text>
		</View>
	);
	return Platform.OS === "ios" ? (
		<TouchableHighlight underlayColor="#0002" onPress={onPress}>
			{content}
		</TouchableHighlight>
	) : (
		<TouchableNativeFeedback
			onPress={onPress}
			background={TouchableNativeFeedback.Ripple("#0002", false)}>
			{content}
		</TouchableNativeFeedback>
	);
};

export const InvoiceScreen = paginatedRefreshListScreen(
	(_: PropsWithChildren<{navigation: HomeNav}>, page) =>
		helper.getInvoiceList(page),
	(invoice, _, {navigation}) => (
		<InvoiceItem
			invoice={invoice}
			onPress={() => {
				navigation.navigate("InvoicePDF", {
					base64: invoice.content,
					id: invoice.inv_no,
				});
			}}
		/>
	),
	({bus_no}) => bus_no,
	undefined,
	undefined,
	() => {
		const themeName = useColorScheme();
		const {colors} = themes(themeName);
		return (
			<View
				style={{
					margin: 15,
					height: Dimensions.get("window").height * 0.6,
					justifyContent: "center",
					alignItems: "center",
				}}>
				<Text
					style={{
						fontSize: 18,
						fontWeight: "bold",
						alignSelf: "center",
						margin: 5,
						color: colors.text,
					}}>
					{getStr("noInvoice")}
				</Text>
			</View>
		);
	},
);
