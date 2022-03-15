import React, {useEffect, useState} from "react";
import {
	Platform,
	RefreshControl,
	SectionList,
	Text,
	TouchableHighlight,
	TouchableNativeFeedback,
	View,
} from "react-native";
import {ReportHeader} from "../../components/home/report";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import themes from "../../assets/themes/themes";
import {helper} from "../../redux/store";
import {useColorScheme} from "react-native";
import {
	BankPayment,
	BankPaymentByMonth,
} from "thu-info-lib/dist/models/home/bank";

const PaymentItem = ({payment}: {payment: BankPayment}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const content = (
		<View
			style={{
				paddingVertical: 10,
				paddingRight: 8,
			}}>
			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-between",
				}}>
				<View
					style={{flexDirection: "column", flex: 3, alignItems: "flex-start"}}>
					<Text style={{fontSize: 13, marginHorizontal: 10, color: "grey"}}>
						{payment.department}
					</Text>
					<Text
						style={{fontSize: 17, marginHorizontal: 10, color: colors.text}}>
						{payment.project}
					</Text>
					<Text style={{fontSize: 14, marginHorizontal: 10, color: "grey"}}>
						{payment.usage}
					</Text>
				</View>
				<View
					style={{flexDirection: "column", flex: 1, alignItems: "flex-end"}}>
					<Text style={{fontSize: 18, marginHorizontal: 6, color: colors.text}}>
						{payment.total}
					</Text>
					<Text style={{fontSize: 12, marginHorizontal: 6, color: "grey"}}>
						{payment.time}
					</Text>
				</View>
			</View>
			<Text style={{fontSize: 14, marginHorizontal: 10, color: "grey"}}>
				{payment.description}
			</Text>
		</View>
	);
	return Platform.OS === "ios" ? (
		<TouchableHighlight underlayColor="#0002">{content}</TouchableHighlight>
	) : (
		<TouchableNativeFeedback
			background={TouchableNativeFeedback.Ripple("#0002", false)}>
			{content}
		</TouchableNativeFeedback>
	);
};

export const BankPaymentScreen = () => {
	const [data, setData] = useState<BankPaymentByMonth[]>([]);
	const [refreshing, setRefreshing] = useState(true);

	const themeName = useColorScheme();
	const theme = themes(themeName);

	const fetchData = () => {
		setRefreshing(true);
		helper
			.getBankPayment()
			.then((r) => {
				setData(r);
				setRefreshing(false);
			})
			.catch(() => {
				Snackbar.show({
					text: getStr("networkRetry"),
					duration: Snackbar.LENGTH_SHORT,
				});
				setRefreshing(false);
			});
	};

	useEffect(fetchData, []);

	return (
		<>
			<SectionList
				sections={data.map(({month, payment}) => ({
					month,
					data: payment,
				}))}
				stickySectionHeadersEnabled={true}
				renderSectionHeader={({section}) => (
					<ReportHeader
						semester={section.month}
						gpa={section.data.reduce(
							(acc, payment) => acc + Number(payment.total),
							0,
						)}
					/>
				)}
				renderItem={({item}) => <PaymentItem payment={item} />}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={fetchData}
						colors={[theme.colors.accent]}
					/>
				}
				keyExtractor={(item) => `${item.time}`}
			/>
		</>
	);
};
