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
import IconRice from "../../assets/icons/IconRice";
import IconWechat from "../../assets/icons/IconWechat";
import IconAlipay from "../../assets/icons/IconAlipay";
import IconBankCard from "../../assets/icons/IconBankCard";
import IconShower from "../../assets/icons/IconShower";
import IconPot from "../../assets/icons/IconPot";
import IconDrink from "../../assets/icons/IconDrink";
import IconHamburger from "../../assets/icons/IconHamburger";
import IconNoodles from "../../assets/icons/IconNoodles";
import IconSwim from "../../assets/icons/IconSwim";

const TransactionItem = ({tx}: {tx: CardTransaction}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const sign = tx.amount > 0 ? "+" : "";

	let icon;
	const iconSize = 32;

	if (tx.name?.includes("微信")) {
		icon = <IconWechat height={iconSize} width={iconSize} />;
	} else if (tx.name?.includes("支付宝")) {
		icon = <IconAlipay height={iconSize} width={iconSize} />;
	} else if (tx.name?.includes("中行")) {
		icon = <IconBankCard height={iconSize} width={iconSize} />;
	} else if (tx.name?.includes("淋浴")) {
		icon = <IconShower height={iconSize} width={iconSize} />;
	} else if (tx.name?.includes("香锅")) {
		icon = <IconPot height={iconSize} width={iconSize} />;
	} else if (tx.name?.includes("饮")) {
		icon = <IconDrink height={iconSize} width={iconSize} />;
	} else if (tx.name?.includes("快餐")) {
		icon = <IconHamburger height={iconSize} width={iconSize} />;
	} else if (tx.name?.includes("牛拉")) {
		icon = <IconNoodles height={iconSize} width={iconSize} />;
	} else if (tx.name?.includes("游泳")) {
		icon = <IconSwim height={iconSize} width={iconSize} />;
	} else {
		icon = <IconRice height={iconSize} width={iconSize} />;
	}

	return (
		<View
			style={{
				marginHorizontal: 16,
				flexDirection: "row",
				justifyContent: "space-between",
			}}>
			<View style={{padding: 4, marginRight: 4, alignSelf: "center"}}>
				{icon}
			</View>
			<View style={{flex: 2, alignItems: "flex-start"}}>
				<Text style={{fontSize: 16, marginVertical: 2, color: colors.text}}>
					{tx.name}
				</Text>
				<Text style={{color: "grey", marginVertical: 2}}>
					{dayjs(tx.timestamp).format("YYYY-MM-DD HH:mm")}
				</Text>
			</View>
			<View style={{flex: 1, alignItems: "flex-end"}}>
				<Text style={{fontSize: 20, color: colors.text}}>
					{sign}
					{Math.abs(tx.amount).toFixed(2)}
				</Text>
			</View>
		</View>
	);
};

interface TxByMonth {
	year: number;
	month: number;
	income: number;
	expenditure: number;
	data: CardTransaction[];
}

export const ExpenditureScreen = () => {
	const [txList, setTxList] = useState<TxByMonth[]>([]);
	const today = dayjs();
	const [ym, setYm] = useState({
		year: today.year(),
		month: today.month() + 1,
		clear: false,
	});

	const [refreshing, setRefreshing] = useState(false);

	const [popupYear, setPopupYear] = useState<number>(today.year());
	const [popupMonth, setPopupMonth] = useState<number>(today.month() + 1);

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
			.then((transactions) => {
				let expenditure = 0;
				let income = 0;
				for (const tx of transactions) {
					tx.name = tx.name?.replace(/_/g, "/") ?? tx.txName;
					if (tx.name.includes("充值") || tx.name.includes("圈存")) {
						income += tx.amount;
					} else {
						expenditure += tx.amount;
						tx.amount *= -1;
					}
				}
				const data = transactions;
				setTxList((prev) =>
					clear
						? [{year, month, income, expenditure, data}]
						: [...prev, {year, month, income, expenditure, data}],
				);
			})
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
					onRefresh={() => {
						setYm({year: today.year(), month: today.month() + 1, clear: true});
					}}
					colors={[colors.accent]}
				/>
			}
			onEndReached={() => {
				if (!refreshing) {
					setYm((prev) => {
						if (prev.month <= 1) {
							return {year: prev.year - 1, month: 12, clear: false};
						} else {
							return {year: prev.year, month: prev.month - 1, clear: false};
						}
					});
				}
			}}
			stickySectionHeadersEnabled={true}
			renderSectionHeader={({section}) => (
				<View
					style={{
						padding: 8,
						backgroundColor: colors.contentBackground,
					}}>
					<BottomPopupTriggerView
						style={{
							flexDirection: "row",
							alignItems: "center",
							marginLeft: 8,
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
						{getStr("outgo")} ￥ {section.expenditure.toFixed(2)}
						{"  "}
						{getStr("income")} ￥ {section.income.toFixed(2)}
					</Text>
				</View>
			)}
			renderItem={({item, index}) => (
				<View key={item.id}>
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
