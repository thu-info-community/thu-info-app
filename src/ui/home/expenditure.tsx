import React, {useEffect, useState} from "react";
import {
	Button,
	FlatList,
	Platform,
	RefreshControl,
	StyleSheet,
	Text,
	View,
} from "react-native";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import {DatePickerTrigger} from "../../components/DatePickerTrigger";
import themes from "../../assets/themes/themes";
import {helper} from "../../redux/store";
import dayjs from "dayjs";
import {Record} from "thu-info-lib/dist/models/home/expenditure";
import {useColorScheme} from "react-native";

const ExpenditureCard = ({record}: {record: Record}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	return (
		<View
			style={{
				padding: 10,
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
				<Text
					style={{fontSize: 20, color: record.value > 0 ? "red" : colors.text}}>
					{(record.value >= 0 ? "+" : "") + record.value.toFixed(2)}
				</Text>
			</View>
		</View>
	);
};

export const Money = ({title, money}: {title: string; money: number}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const strMoney = money.toFixed(2);
	const bigMoney = strMoney.substring(0, strMoney.length - 3);
	const smallMoney = strMoney.substring(strMoney.length - 3);
	return (
		<View style={{alignItems: "center", flex: 1, padding: 5}}>
			<Text style={{color: colors.text}}>{title}</Text>
			<View style={{flexDirection: "row", alignItems: "flex-end"}}>
				<Text style={{fontSize: 28, color: colors.text}}>{bigMoney}</Text>
				<Text style={{fontSize: 18, color: colors.text}}>{smallMoney}</Text>
			</View>
		</View>
	);
};

export const ExpenditureScreen = () => {
	const [[expenditures, income, outgo, remainder], setExpenditures] = useState<
		[Record[], number, number, number]
	>([[], 0, 0, 0]);

	const [beg, setBeg] = useState(dayjs().add(-1, "month").toDate());
	const [end, setEnd] = useState(dayjs().toDate());
	const [refreshing, setRefreshing] = useState(false);

	const themeName = useColorScheme();
	const theme = themes(themeName);

	const refresh = () => {
		setRefreshing(true);
		helper
			.getExpenditures(beg, end)
			.then(setExpenditures)
			.catch((e) => {
				Snackbar.show({
					text: getStr("networkRetry") + e?.message,
					duration: Snackbar.LENGTH_SHORT,
				});
			})
			.then(() => setRefreshing(false));
	};

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(refresh, []);

	return (
		<View style={{padding: 10, flex: 1}}>
			<View style={{flexDirection: "row"}}>
				<Money title={getStr("income")} money={income} />
				<Money title={getStr("outgo")} money={outgo} />
				<Money title={getStr("remainder")} money={refreshing ? 0 : remainder} />
			</View>
			{!helper.mocked() && (
				<View style={styles.header}>
					<DatePickerTrigger
						date={beg}
						onChange={setBeg}
						disabled={refreshing}
						text={Platform.OS === "ios" ? getStr("begDate") : ""}
					/>
					<DatePickerTrigger
						date={end}
						onChange={setEnd}
						disabled={refreshing}
						text={Platform.OS === "ios" ? getStr("endDate") : ""}
					/>
					<Button
						title={getStr("query")}
						onPress={refresh}
						disabled={refreshing}
					/>
				</View>
			)}
			<View style={styles.container}>
				<FlatList
					data={expenditures}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={refresh}
							colors={[theme.colors.accent]}
						/>
					}
					renderItem={({item}) => <ExpenditureCard record={item} />}
					keyExtractor={(item, index) => `${item.date}-${item.value}-${index}`}
				/>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		alignItems: "center",
	},
	container: {
		alignItems: "stretch",
		justifyContent: "center",
		letterSpacing: 12,
		flex: 1,
	},
});
