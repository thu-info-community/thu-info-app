import React, {useEffect, useState} from "react";
import {FlatList, RefreshControl, StyleSheet, Text, View} from "react-native";
import {getExpenditures} from "../../network/basics";
import {Record} from "../../models/home/expenditure";
// @ts-ignore
import {MyDatePicker} from "../../components/DatePicker";
import {Calendar} from "../../utils/calendar";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";

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

export const ExpenditureScreen = () => {
	const [expenditures, setExpenditures] = useState<Record[]>([]);

	const today = new Calendar();
	const [beg, setBeg] = useState(today.date.add(-1, "month").toDate());
	const [end, setEnd] = useState(today.date.toDate());
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
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
	}, [beg, end]);

	return (
		<>
			<View style={styles.header}>
				<MyDatePicker date={beg} onChange={setBeg} disabled={refreshing} />
				<MyDatePicker date={end} onChange={setEnd} disabled={refreshing} />
			</View>
			<View style={styles.container}>
				<FlatList
					data={expenditures}
					refreshControl={<RefreshControl refreshing={refreshing} />}
					renderItem={({item}) => <ExpenditureCard record={item} />}
					keyExtractor={(item, index) => `${item.date}-${item.value}-${index}`}
				/>
			</View>
		</>
	);
};

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
	},
	container: {
		alignItems: "stretch",
		justifyContent: "center",
		letterSpacing: 12,
		flex: 1,
	},
});
