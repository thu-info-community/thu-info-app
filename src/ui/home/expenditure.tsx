import React, {useEffect, useState} from "react";
import {
	NativeScrollEvent,
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import themes from "../../assets/themes/themes";
import {helper} from "../../redux/store";
import {Record} from "thu-info-lib/dist/models/home/expenditure";
import {useColorScheme} from "react-native";
import {RoundedView} from "../../components/views";
import Icon from "react-native-vector-icons/FontAwesome";

const ExpenditureCard = ({record}: {record: Record}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	return (
		<View
			style={{
				marginHorizontal: 16,
				flexDirection: "row",
				justifyContent: "space-between",
			}}>
			<View style={{flex: 2, alignItems: "flex-start"}}>
				<Text style={{fontSize: 16, marginVertical: 2, color: colors.text}}>
					{record.locale}
				</Text>
				<Text style={{color: "grey", marginVertical: 2}}>
					{record.category}
				</Text>
				<Text style={{color: "grey", marginVertical: 2}}>{record.date}</Text>
			</View>
			<View style={{flex: 1, alignItems: "flex-end"}}>
				<Text style={{fontSize: 20, color: colors.text}}>
					{record.value.toFixed(2)}
				</Text>
			</View>
		</View>
	);
};

const isCloseToBottom = ({
	layoutMeasurement,
	contentOffset,
	contentSize,
}: NativeScrollEvent) => {
	const paddingToBottom = 100;
	return (
		layoutMeasurement.height + contentOffset.y >=
		contentSize.height - paddingToBottom
	);
};

export const ExpenditureScreen = () => {
	const [expenditures, setExpenditures] = useState<Record[]>([]);
	const [ymBound, setYmBound] = useState<number>(1);

	const [refreshing, setRefreshing] = useState(false);

	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const remainder = expenditures.reduce(
		(prev: number, curr: Record) =>
			prev + (curr.category === "领取旧卡余额" ? 0 : curr.value),
		0,
	);

	const strRemainder = remainder.toFixed(2);

	const ymList: {year: number; month: number; records: Record[]}[] = [];
	for (const record of expenditures) {
		const year = Number(record.date.substring(0, 4));
		const month = Number(record.date.substring(5, 7));
		if (ymList[0]?.year === year && ymList[0]?.month === month) {
			ymList[0].records.unshift(record);
		} else {
			ymList.unshift({year, month, records: [record]});
		}
	}

	const refresh = () => {
		setRefreshing(true);
		helper
			.getExpenditures()
			.then(setExpenditures)
			.catch((e) => {
				Snackbar.show({
					text: getStr("networkRetry") + e?.message,
					duration: Snackbar.LENGTH_SHORT,
				});
			})
			.then(() => setRefreshing(false));
	};

	useEffect(refresh, []);

	return (
		<ScrollView
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={refresh}
					colors={[colors.accent]}
				/>
			}
			onScroll={({nativeEvent}) => {
				if (isCloseToBottom(nativeEvent)) {
					setYmBound(Math.min(ymBound, ymList.length) + 1);
				}
			}}
			scrollEventThrottle={400}>
			<RoundedView style={{margin: 12}}>
				<View style={{alignItems: "center", flex: 1, padding: 5}}>
					<Text style={{color: colors.fontB2, fontSize: 11}}>
						{getStr("remainder")}
					</Text>
					<Text style={{fontSize: 24, fontWeight: "bold", color: colors.text}}>
						￥{strRemainder}
					</Text>
				</View>
			</RoundedView>
			{ymList.slice(0, ymBound).map(({year, month, records}) => {
				let outgo = 0;
				let income = 0;
				for (const record of records) {
					if (record.category !== "领取旧卡余额") {
						if (record.value > 0) {
							income += record.value;
						} else {
							outgo -= record.value;
						}
					}
				}
				return (
					<View style={{margin: 12}} key={`${year}-${month}`}>
						<View style={{flexDirection: "row", alignItems: "center"}}>
							<TouchableOpacity
								style={{flexDirection: "row", alignItems: "center"}}>
								<Text style={{color: colors.text, fontSize: 16}}>
									{year} 年 {month} 月
								</Text>
								<Icon
									name="chevron-down"
									size={12}
									color={colors.text}
									style={{marginHorizontal: 8}}
								/>
							</TouchableOpacity>
							<Text style={{color: colors.fontB2, fontSize: 14}}>
								{getStr("outgo")} ￥ {outgo.toFixed(2)}
								{"  "}
								{getStr("income")} ￥ {income.toFixed(2)}
							</Text>
						</View>
						<RoundedView style={{marginTop: 8}}>
							{records.map((record, index) => (
								<View key={record.locale + record.date + record.value + index}>
									{index > 0 && (
										<View
											style={{
												borderWidth: 0.2,
												marginHorizontal: 16,
												marginVertical: 12,
												borderColor: colors.themeGrey,
											}}
										/>
									)}
									<ExpenditureCard record={record} />
								</View>
							))}
						</RoundedView>
					</View>
				);
			})}
		</ScrollView>
	);
};
