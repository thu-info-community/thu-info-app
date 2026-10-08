import {useState} from "react";
import {FlatList, Text, useColorScheme, View} from "react-native";
import {getStr} from "../../utils/i18n";
import themes from "../../assets/themes/themes";
import {helper} from "../../redux/store";
import {BottomPopupTriggerView} from "../../components/views";
import dayjs from "dayjs";
import ScrollPicker from "react-native-wheel-scrollview-picker";
import {GraduateIncome} from "@thu-info/lib/src/models/home/bank.ts";
import {NetworkRetry} from "../../components/easySnackbars.ts";
import {Separator} from "../../components/subpage/rows";
import {roundedListContent, spacing} from "../../components/subpage/tokens";
import {PrimaryButton} from "../../components/subpage/buttons";

export const BottomPopup = ({
	year,
	setYear,
	month,
	setMonth,
}: {
	year: number;
	setYear: (year: number) => void;
	month: number;
	setMonth: (month: number) => void;
}) => {
	const today = dayjs();

	const [popupYear, setPopupYear] = useState(year);
	const [popupMonth, setPopupMonth] = useState(month);

	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	return <View style={{flex: 1, alignItems: "center"}}><BottomPopupTriggerView
		popupTitle={`${popupYear}.${popupMonth}`}
		popupContent={
			<View style={{flexDirection: "row"}}>
				<ScrollPicker
					style={{flex: 1}}
					dataSource={Array.from(
						new Array(today.year() - 1911 + 1),
						(_, k) => String(k + 1911),
					).reverse()}
					selectedIndex={today.year() - popupYear}
					renderItem={(data) => (
						<Text
							style={{color: colors.fontB1, fontSize: 20}}
							key={data}>
							{data}
						</Text>
					)}
					onValueChange={(_, selectedIndex) => {
						setPopupYear(today.year() - selectedIndex);
					}}
					wrapperHeight={200}
					wrapperBackground={colors.contentBackground}
					itemHeight={48}
					highlightColor={colors.themeGrey}
					highlightBorderWidth={1}
				/>
				<ScrollPicker
					style={{flex: 1}}
					dataSource={Array.from(
						new Array(12),
						(_, k) => String(k + 1),
					)}
					selectedIndex={popupMonth - 1}
					renderItem={(data) => (
						<Text
							style={{color: colors.fontB1, fontSize: 20}}
							key={data}>
							{data}
						</Text>
					)}
					onValueChange={(_, selectedIndex) => {
						setPopupMonth(selectedIndex + 1);
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
			setYear(popupYear);
			setMonth(popupMonth);
		}}
		popupOnCancelled={() => {}}>
		<View style={{flexDirection: "row", alignItems: "center"}}>
			<Text style={{color: colors.fontB1, fontSize: 16, flex: 0}}>
				{`${year}.${month}`}
			</Text>
		</View>
	</BottomPopupTriggerView></View>;
};

export const IncomeScreen = () => {
	const [processing, setProcessing] = useState(false);

	const today = dayjs();

	const [beginYear, setBeginYear] = useState(today.year());
	const [beginMonth, setBeginMonth] = useState(today.month() + 1);
	const [endYear, setEndYear] = useState(today.year());
	const [endMonth, setEndMonth] = useState(today.month() + 1);

	const [data, setData] = useState<GraduateIncome[]>([]);

	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const valid = beginYear < endYear || beginYear === endYear && beginMonth <= endMonth;

	return (
		<View style={{flex: 1, backgroundColor: colors.themeBackground}}>
			<View style={{margin: spacing.md, flexDirection: "row", alignItems: "center"}}>
				<BottomPopup year={beginYear} setYear={setBeginYear} month={beginMonth} setMonth={setBeginMonth}/>
				<BottomPopup year={endYear} setYear={setEndYear} month={endMonth} setMonth={setEndMonth}/>
				<PrimaryButton
					text={getStr(processing ? "processing" : "query")}
					disabled={!valid}
					loading={processing}
					onPress={() => {
						setProcessing(true);
						const begin = dayjs(`${beginYear}-${beginMonth}-1`);
						const end = dayjs(`${endYear}-${endMonth}-1`).endOf("month");
						helper
							.getGraduateIncome(
								begin.format("YYYYMMDD"),
								end.format("YYYYMMDD"),
							)
							.then((r) => setData(r))
							.catch(NetworkRetry)
							.then(() => setProcessing(false));
					}}
				/>
			</View>
			<FlatList
				style={{flex: 1, margin: spacing.md}}
				data={data}
				contentContainerStyle={roundedListContent(colors, data.length > 0)}
				renderItem={({item, index}) => (
					<>
						{index > 0 && <Separator style={{marginHorizontal: 0}} />}
						<View style={{flexDirection: "row"}}>
							<Text
								style={{flex: 1, fontSize: 16, color: colors.text}}
								numberOfLines={2}>
								{item.name}
							</Text>
							<Text
								style={{
									flex: 1,
									fontSize: 16,
									color: colors.text,
									textAlign: "right",
								}}>
								{item.beforeTax}
							</Text>
						</View>
						<View style={{flexDirection: "row", marginTop: 4}}>
							<Text style={{flex: 1, fontSize: 14, color: colors.fontB2}}>
								{item.department}
							</Text>
							<Text
								style={{
									flex: 1,
									fontSize: 14,
									color: colors.fontB2,
									textAlign: "right",
								}}>
								{getStr("afterTax")} {item.afterTax} {getStr("tax")} {item.tax}
							</Text>
						</View>
						<Text style={{fontSize: 14, color: colors.fontB2, marginTop: 4}}>
							{item.date}
						</Text>
					</>
				)}
				keyExtractor={(item) => item.id}
			/>
		</View>
	);
};
