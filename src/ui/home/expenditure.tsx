import React, {useContext, useEffect, useState} from "react";
import {
	Alert,
	Button,
	FlatList,
	Platform,
	RefreshControl,
	StyleSheet,
	Text,
	View,
} from "react-native";
import {getExpenditures} from "../../network/basics";
import {Record} from "../../models/home/expenditure";
import {Calendar} from "../../utils/calendar";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import {DatePickerTrigger} from "../../components/DatePickerTrigger";
import {ThemeContext} from "../../assets/themes/context";
import themes from "../../assets/themes/themes";
import {mocked} from "../../redux/store";

const ExpenditureCard = ({record}: {record: Record}) => {
	return (
		<View
			style={{
				padding: 10,
				flexDirection: "row",
				justifyContent: "space-between",
			}}>
			<View style={{flex: 2, alignItems: "flex-start"}}>
				<Text style={{fontSize: 16}}>{record.locale}</Text>
				<Text style={{color: "grey"}}>{record.category}</Text>
				<Text style={{color: "grey"}}>{record.date}</Text>
			</View>
			<View style={{flex: 1, alignItems: "flex-end"}}>
				<Text style={{fontSize: 20, color: record.value > 0 ? "red" : "black"}}>
					{(record.value >= 0 ? "+" : "") + record.value.toFixed(2)}
				</Text>
			</View>
		</View>
	);
};

export const Money = ({title, money}: {title: string; money: number}) => {
	const strMoney = money.toFixed(2);
	const bigMoney = strMoney.substring(0, strMoney.length - 3);
	const smallMoney = strMoney.substring(strMoney.length - 3);
	return (
		<View style={{alignItems: "center", flex: 1, padding: 5}}>
			<Text>{title}</Text>
			<View style={{flexDirection: "row", alignItems: "flex-end"}}>
				<Text style={{fontSize: 28}}>{bigMoney}</Text>
				<Text style={{fontSize: 18}}>{smallMoney}</Text>
			</View>
		</View>
	);
};

export const ExpenditureScreen = () => {
	const [[expenditures, income, outgo, remainder], setExpenditures] = useState<
		[Record[], number, number, number]
	>([[], 0, 0, 0]);

	const today = new Calendar();
	const [beg, setBeg] = useState(today.date.add(-1, "month").toDate());
	const [end, setEnd] = useState(today.date.toDate());
	const [refreshing, setRefreshing] = useState(false);

	const themeName = useContext(ThemeContext);
	const theme = themes[themeName];

	const refresh = () => {
		setRefreshing(true);
		getExpenditures(beg, end)
			.then(setExpenditures)
			.catch(() => {
				Snackbar.show({
					text: getStr("networkRetry"),
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
				<Money title={getStr("remainder")} money={remainder} />
			</View>
			{!mocked() && (
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
					<Button
						title={getStr("question")}
						onPress={() => {
							Alert.alert(
								getStr("question"),
								getStr("expenditureFAQ"),
								[{text: getStr("ok")}],
								{cancelable: true},
							);
						}}
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
