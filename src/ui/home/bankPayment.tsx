import React, {useEffect, useState} from "react";
import {RefreshControl, ScrollView, Text, View} from "react-native";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import themes from "../../assets/themes/themes";
import {helper} from "../../redux/store";
import {useColorScheme} from "react-native";
import {BankPaymentByMonth} from "thu-info-lib/dist/models/home/bank";
import {RoundedView} from "../../components/views";

export const BankPaymentScreen = () => {
	const [data, setData] = useState<BankPaymentByMonth[]>([]);
	const [refreshing, setRefreshing] = useState(true);

	const themeName = useColorScheme();
	const {colors} = themes(themeName);

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
			<ScrollView
				style={{flex: 1, margin: 12, marginTop: 4}}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={fetchData}
						colors={[colors.accent]}
					/>
				}>
				<View>
					{data.map(({month, payment}) => (
						<View key={month} style={{marginTop: 12}}>
							<View
								style={{
									flexDirection: "row",
									justifyContent: "space-between",
									alignItems: "center",
								}}>
								<Text
									numberOfLines={1}
									style={{
										fontSize: 16,
										color: colors.text,
										marginLeft: 6,
									}}>
									{month}
								</Text>
								<Text
									numberOfLines={1}
									style={{
										fontSize: 16,
										color: colors.text,
										marginRight: 16,
									}}>
									￥
									{payment
										.reduce((acc, {total}) => acc + Number(total), 0)
										.toFixed(2)}
								</Text>
							</View>
							<RoundedView style={{marginTop: 8}}>
								{payment.map((item, index) => (
									<View key={item.time}>
										{index > 0 && (
											<View
												style={{
													borderWidth: 0.2,
													borderColor: colors.themeGrey,
													margin: 12,
												}}
											/>
										)}
										<View style={{flexDirection: "row", marginHorizontal: 16}}>
											<Text
												style={{flex: 3, fontSize: 16, color: colors.text}}
												numberOfLines={2}>
												{item.project}
											</Text>
											<Text
												style={{
													flex: 1,
													fontSize: 16,
													color: colors.text,
													textAlign: "right",
												}}>
												{item.total}
											</Text>
										</View>
										<View
											style={{
												flexDirection: "row",
												marginHorizontal: 16,
												marginTop: 4,
											}}>
											<Text
												style={{flex: 3, fontSize: 14, color: colors.fontB2}}>
												{item.department}
											</Text>
											<Text
												style={{
													flex: 1,
													fontSize: 14,
													color: colors.fontB2,
													textAlign: "right",
												}}>
												{item.usage}
											</Text>
										</View>
										{item.description.length > 0 && (
											<Text
												style={{
													fontSize: 14,
													color: colors.fontB2,
													marginHorizontal: 16,
													marginTop: 4,
												}}>
												{item.description}
											</Text>
										)}
										<Text
											style={{
												fontSize: 14,
												color: colors.fontB2,
												marginHorizontal: 16,
												marginTop: 4,
											}}>
											{item.time}
										</Text>
									</View>
								))}
							</RoundedView>
						</View>
					))}
				</View>
			</ScrollView>
		</>
	);
};
