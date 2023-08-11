import {useEffect, useState} from "react";
import {
	RefreshControl,
	SectionList,
	Text,
	useColorScheme,
	View,
} from "react-native";
import {getStr} from "../../utils/i18n";
import themes from "../../assets/themes/themes";
import {helper} from "../../redux/store";
import {
	CardTransaction,
	CardTransactionType,
} from "thu-info-lib/dist/models/card/transaction";
import {BottomPopupTriggerView} from "../../components/views";
import IconDown from "../../assets/icons/IconDown";
import ScrollPicker from "react-native-wheel-scrollview-picker";
import {NetworkRetry} from "../../components/easySnackbars";
import dayjs from "dayjs";

const TransactionItem = ({tx}: {tx: CardTransaction}) => {
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
					{tx.summary}
				</Text>
				<Text style={{color: "grey", marginVertical: 2}}>
					{tx.timestamp.toISOString()}
				</Text>
			</View>
			<View style={{flex: 1, alignItems: "flex-end"}}>
				<Text style={{fontSize: 20, color: colors.text}}>
					{tx.amount.toFixed(2)}
				</Text>
			</View>
		</View>
	);
};

interface TxByMonth {
	year: number;
	month: number;
	data: CardTransaction[];
}

export const ExpenditureScreen = () => {
	const [txList, setTxList] = useState<TxByMonth[]>([]);
	const today = dayjs();
	const [ym, setYm] = useState({
		year: today.year(),
		month: today.month(),
		clear: false,
	});

	const [refreshing, setRefreshing] = useState(false);

	const [popupYear, setPopupYear] = useState<number>(today.year());
	const [popupMonth, setPopupMonth] = useState<number>(today.month());

	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const years = Array.from(
		new Array(today.year() - 2023 + 1),
		(_, k) => k + 2023,
	);

	const months = Array.from(new Array(12), (_, k) => k + 1);

	const refresh = () => {
		setRefreshing(true);
		const {year, month, clear} = ym;
		const firstDay = dayjs(`${year}-${month}-01`);
		const lastDay = firstDay.endOf("month");
		helper
			.getCampusCardTransactions(
				firstDay.format("YYYY-MM-DD"),
				lastDay.format("YYYY-MM-DD"),
				CardTransactionType.Any,
			)
			.then((data) =>
				setTxList((prev) =>
					clear ? [{year, month, data}] : [...prev, {year, month, data}],
				),
			)
			.catch(NetworkRetry)
			.then(() => setRefreshing(false));
	};

	useEffect(refresh, [ym]);

	return (
		<SectionList
			sections={txList}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={refresh}
					colors={[colors.accent]}
				/>
			}
			onEndReached={() =>
				setYm((prev) => {
					if (prev.month <= 1) {
						return {year: prev.year - 1, month: 12, clear: false};
					} else {
						return {year: prev.year, month: prev.month - 1, clear: false};
					}
				})
			}
			stickySectionHeadersEnabled={true}
			renderSectionHeader={({section}) => (
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						marginLeft: 8,
					}}>
					<BottomPopupTriggerView
						style={{
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "center",
						}}
						popupTitle={`${popupYear} 年 ${popupMonth} 月`}
						popupOnTriggered={() => {
							setPopupYear(section.year);
							setPopupMonth(section.month);
						}}
						popupContent={
							<View style={{flexDirection: "row"}}>
								<ScrollPicker
									style={{flex: 1}}
									dataSource={years}
									selectedIndex={years.indexOf(section.year)}
									renderItem={(data) => (
										<Text
											style={{color: colors.fontB1, fontSize: 20}}
											key={data}>
											{data}
										</Text>
									)}
									onValueChange={(_, selectedIndex) => {
										setPopupYear(years[selectedIndex]);
									}}
									wrapperHeight={200}
									wrapperBackground={colors.contentBackground}
									itemHeight={48}
									highlightColor={colors.themeGrey}
									highlightBorderWidth={1}
								/>
								<ScrollPicker
									style={{flex: 1}}
									dataSource={months}
									selectedIndex={months.indexOf(section.month)}
									renderItem={(data) => (
										<Text
											style={{color: colors.fontB1, fontSize: 20}}
											key={data}>
											{data}
										</Text>
									)}
									onValueChange={(_, selectedIndex) => {
										setPopupMonth(months[selectedIndex]);
									}}
									wrapperHeight={200}
									wrapperBackground={colors.contentBackground}
									itemHeight={48}
									highlightColor={colors.themeGrey}
									highlightBorderWidth={1}
								/>
							</View>
						}
						popupCanFulfill={true}
						popupOnFulfilled={() => {
							setYm({year: popupYear, month: popupMonth, clear: true});
						}}
						popupOnCancelled={() => {}}>
						<Text style={{color: colors.text, fontSize: 16}}>
							{section.year} 年 {section.month} 月
						</Text>
						<IconDown height={18} width={18} />
					</BottomPopupTriggerView>
					<Text style={{color: colors.fontB2, fontSize: 14, marginLeft: 8}}>
						{getStr("outgo")} ￥ {(0).toFixed(2)}
						{"  "}
						{getStr("income")} ￥ {(0).toFixed(2)}
					</Text>
				</View>
			)}
			renderItem={({item, index}) => (
				<View key={String(item.timestamp)}>
					{index > 0 && (
						<View
							style={{
								borderWidth: 0.4,
								marginHorizontal: 16,
								marginVertical: 12,
								borderColor: colors.themeGrey,
							}}
						/>
					)}
					<TransactionItem tx={item} />
				</View>
			)}
			contentContainerStyle={{
				backgroundColor: colors.contentBackground,
				padding: 16,
			}}
		/>
	);
};
