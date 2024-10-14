import {useState} from "react";
import {
	FlatList,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {getStr} from "../../utils/i18n";
import themes from "../../assets/themes/themes";
import {helper} from "../../redux/store";
import {BottomPopupTriggerView} from "../../components/views";
import dayjs from "dayjs";
import ScrollPicker from "react-native-wheel-scrollview-picker";
import {GraduateIncome} from "@thu-info/lib/src/models/home/bank.ts";
import {NetworkRetry} from "../../components/easySnackbars.ts";

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
		<View style={{flex: 1, backgroundColor: colors.contentBackground}}>
			<View style={{margin: 12, flexDirection: "row", alignItems: "center"}}>
				<BottomPopup year={beginYear} setYear={setBeginYear} month={beginMonth} setMonth={setBeginMonth}/>
				<BottomPopup year={endYear} setYear={setEndYear} month={endMonth} setMonth={setEndMonth}/>
				<TouchableOpacity
					style={{
						backgroundColor: valid
							? colors.primaryLight
							: colors.mainTheme,
						alignItems: "center",
						justifyContent: "center",
						paddingVertical: 8,
						paddingHorizontal: 12,
						borderRadius: 4,
					}}
					disabled={!valid || processing}
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
					}}>
					<Text
						style={{
							color:
								valid && !processing
									? colors.contentBackground
									: colors.themeGrey,
							fontSize: 16,
						}}>
						{getStr(processing ? "processing" : "query")}
					</Text>
				</TouchableOpacity>
			</View>
			<FlatList
				style={{padding: 12, flex: 1}}
				data={data}
				renderItem={({item, index}) => {
					return (
						<View>
							{index > 0 && (
								<View
									style={{
										borderWidth: 0.4,
										borderColor: colors.themeGrey,
										margin: 12,
									}}
								/>
							)}
							<View style={{flexDirection: "row", marginHorizontal: 16}}>
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
							<View
								style={{
									flexDirection: "row",
									marginHorizontal: 16,
									marginTop: 4,
								}}>
								<Text
									style={{flex: 1, fontSize: 14, color: colors.fontB2}}>
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
							<Text
								style={{
									fontSize: 14,
									color: colors.fontB2,
									marginHorizontal: 16,
									marginTop: 4,
								}}>
								{item.date}
							</Text>
						</View>
					);
				}}
				keyExtractor={(item) => item.id}
			/>
		</View>
	);
};
