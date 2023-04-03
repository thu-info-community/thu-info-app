import {useEffect, useState} from "react";
import {helper} from "../../redux/store";
import {Text, View, useColorScheme} from "react-native";
import themes from "../../assets/themes/themes";
import {Detial} from "thu-info-lib/dist/models/network/detial";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import {RefreshControl, ScrollView} from "react-native-gesture-handler";
import {BottomPopupTriggerView, RoundedView} from "../../components/views";
import ScrollPicker from "react-native-wheel-scrollview-picker";
import IconDown from "../../assets/icons/IconDown";

const DetailCard = ({detail}: {detail: Detial}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const Item = ({left, right}: {left: string; right: string}) => {
		return (
			<View
				style={{
					marginTop: 2,
					flexDirection: "row",
					justifyContent: "space-between",
				}}>
				<View
					style={{
						flex: 2,
						alignItems: "flex-start",
					}}>
					<Text
						style={{
							color: colors.text,
						}}>
						{left}
					</Text>
				</View>
				<View
					style={{
						flex: 1,
						alignItems: "flex-end",
					}}>
					<Text
						style={{
							color: colors.text,
						}}>
						{right}
					</Text>
				</View>
			</View>
		);
	};

	return (
		<View style={{marginHorizontal: 16}}>
			<Text style={{fontSize: 16, marginVertical: 2, color: colors.text}}>
				Wired
			</Text>
			<Item left={"in"} right={detail.wiredUsage.in} />
			<Item left={"out"} right={detail.wiredUsage.out} />
			<Item left={"total"} right={detail.wiredUsage.total} />
			<Item left={"online time"} right={detail.wiredUsage.onlineTime} />
			<Item left={"login count"} right={detail.wiredUsage.loginCount} />
			<Item left={"current cost"} right={detail.wiredUsage.currentCost} />
			<View
				style={{
					borderWidth: 0.4,
					marginHorizontal: 16,
					marginVertical: 12,
					borderColor: colors.themeGrey,
				}}
			/>
			<Text style={{fontSize: 16, marginVertical: 2, color: colors.text}}>
				Wireless
			</Text>
			<Item left={"in"} right={detail.wirelessUsage.in} />
			<Item left={"out"} right={detail.wirelessUsage.out} />
			<Item left={"total"} right={detail.wirelessUsage.total} />
			<Item left={"online time"} right={detail.wirelessUsage.onlineTime} />
			<Item left={"login count"} right={detail.wirelessUsage.loginCount} />
			<Item left={"current cost"} right={detail.wirelessUsage.currentCost} />
			<View
				style={{
					borderWidth: 0.4,
					marginHorizontal: 16,
					marginVertical: 12,
					borderColor: colors.themeGrey,
				}}
			/>
			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-between",
				}}>
				<View style={{flex: 2, alignItems: "flex-start"}}>
					<Text style={{fontSize: 16, marginVertical: 2, color: colors.text}}>
						Cost
					</Text>
				</View>
				<View style={{flex: 1, alignItems: "flex-end"}}>
					<Text style={{fontSize: 20, color: colors.text}}>
						{detail.monthlyCost}
					</Text>
				</View>
			</View>
		</View>
	);
};

export const NetworkDetailScreen = () => {
	const [m, setM] = useState(4);
	const [y, setY] = useState(2023);
	const [detail, setDetail] = useState<Detial>();
	const [popupYear, setPopupYear] = useState<number>(y);
	const [popupMonth, setPopupMonth] = useState<number>(m);

	const [refreshing, setRefreshing] = useState(false);

	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	// TODO
	const yearsSorted = [2018, 2019, 2020, 2021, 2022, 2023];
	const monthsSorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

	const refresh = () => {
		setRefreshing(true);
		helper
			.getNetworkDetail(y, m)
			.then(setDetail)
			.catch((e) => {
				Snackbar.show({
					text: getStr("networkRetry") + e?.message,
					duration: Snackbar.LENGTH_SHORT,
				});
			})
			.then(() => setRefreshing(false));
	};

	useEffect(refresh, [y, m]);
	return (
		<ScrollView
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={refresh}
					colors={[colors.accent]}
				/>
			}>
			<RoundedView style={{margin: 12}}>
				<View style={{alignItems: "center", flex: 1, padding: 5}}>
					<Text style={{color: colors.fontB2, fontSize: 11}}>
						{getStr("remainder")}
					</Text>
					<Text style={{fontSize: 24, fontWeight: "bold", color: colors.text}}>
						{/* TODO */}
						￥5.00
					</Text>
				</View>
			</RoundedView>
			<View style={{margin: 12}}>
				<View
					style={{
						flexDirection: "row",
						alignContent: "center",
						marginLeft: 8,
					}}>
					<BottomPopupTriggerView
						style={{
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "center",
						}}
						popupTitle={"2023 年 4 月"}
						popupOnTriggered={() => {}}
						popupContent={
							<View style={{flexDirection: "row"}}>
								<ScrollPicker
									style={{flex: 1}}
									dataSource={yearsSorted}
									selectedIndex={yearsSorted.indexOf(y)}
									renderItem={(data) => (
										<Text
											style={{color: colors.fontB1, fontSize: 20}}
											key={data}>
											{data}
										</Text>
									)}
									onValueChange={(_, selectedIndex) => {
										setPopupYear(yearsSorted[selectedIndex]);
									}}
									wrapperHeight={200}
									wrapperColor={colors.contentBackground}
									itemHeight={48}
									highlightColor={colors.themeGrey}
									highlightBorderWidth={1}
								/>
								<ScrollPicker
									style={{flex: 1}}
									dataSource={monthsSorted}
									selectedIndex={monthsSorted.indexOf(m)}
									renderItem={(data) => (
										<Text
											style={{color: colors.fontB1, fontSize: 20}}
											key={data}>
											{data}
										</Text>
									)}
									onValueChange={(_, selectedIndex) => {
										setPopupMonth(monthsSorted[selectedIndex]);
									}}
									wrapperHeight={200}
									wrapperColor={colors.contentBackground}
									itemHeight={48}
									highlightColor={colors.themeGrey}
									highlightBorderWidth={1}
								/>
							</View>
						}
						popupCanFulfill={true}
						popupOnFulfilled={() => {
							setY(popupYear);
							setM(popupMonth);
						}}
						popupOnCancelled={() => {}}>
						<Text style={{color: colors.text, fontSize: 16}}>
							{/* TODO */}
							{y} 年 {m} 月
						</Text>
						<IconDown height={18} width={18} />
					</BottomPopupTriggerView>
				</View>
				<RoundedView style={{marginTop: 8}}>
					{detail && (
						<View>
							<DetailCard detail={detail!} />
						</View>
					)}
				</RoundedView>
			</View>
		</ScrollView>
	);
};
