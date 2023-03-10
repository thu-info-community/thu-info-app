import {PropsWithChildren} from "react";
import {Text, TouchableOpacity, View} from "react-native";
import {helper} from "../../redux/store";
import {paginatedRefreshListScreen} from "../../components/settings/paginatedRefreshListScreen";
import {RootNav} from "../../components/Root";
import {getStr} from "../../utils/i18n";
import Snackbar from "react-native-snackbar";

export const InvoiceScreen = paginatedRefreshListScreen(
	(_: PropsWithChildren<{navigation: RootNav}>, page) =>
		helper.getInvoiceList(page).then(({data}) => data),
	(invoice, _, {navigation}, {colors}, index) => (
		<>
			{index > 0 && (
				<View
					style={{
						borderWidth: 0.4,
						borderColor: colors.themeGrey,
						marginVertical: 12,
					}}
				/>
			)}
			<TouchableOpacity
				onPress={() => {
					Snackbar.show({
						text: getStr("loading"),
						duration: Snackbar.LENGTH_SHORT,
					});
					helper.getInvoicePDF(invoice.bus_no).then((pdf) => {
						navigation.navigate("InvoicePDF", {
							base64: pdf,
							filename: `${invoice.financial_item_name}-${invoice.inv_no}`,
						});
					});
				}}>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
					}}>
					<Text style={{fontSize: 16, color: colors.fontB1}}>
						{invoice.financial_item_name}
					</Text>
					<Text style={{fontSize: 16, color: colors.fontB1}}>
						{invoice.inv_amount.toFixed(2)}
					</Text>
				</View>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
						marginTop: 4,
					}}>
					<Text style={{fontSize: 14, color: colors.fontB3}}>
						{invoice.inv_no}
					</Text>
					<Text style={{fontSize: 14, color: colors.fontB3}}>
						{invoice.financial_dept_name}/{invoice.payment_item_type_name}
					</Text>
				</View>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
						flexWrap: "wrap",
					}}>
					<Text style={{fontSize: 14, color: colors.fontB3, marginTop: 4}}>
						{invoice.inv_date}
					</Text>
					<Text style={{fontSize: 14, color: colors.fontB3, marginTop: 4}}>
						{invoice.inv_note}
					</Text>
				</View>
			</TouchableOpacity>
		</>
	),
	({bus_no}) => bus_no,
	undefined,
	undefined,
	({colors}) => (
		<Text style={{color: colors.text, textAlign: "center"}}>
			{getStr("noInvoice")}
		</Text>
	),
);
