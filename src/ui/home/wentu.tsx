import React, {useEffect, useState} from "react";
import {FlatList, RefreshControl, StyleSheet, Text, View} from "react-native";
import {getStr} from "../../utils/i18n";
import {getWentuState} from "../../network/basics";
import Snackbar from "react-native-snackbar";

export const WentuScreen = () => {
	const [wentuState, setWentuState] = useState<[string, number, number][]>([]);
	const [refreshing, setRefreshing] = useState(false);

	const update = () => {
		setRefreshing(true);
		getWentuState()
			.then(setWentuState)
			.catch(() =>
				Snackbar.show({
					text: getStr("networkRetry"),
					duration: Snackbar.LENGTH_SHORT,
				}),
			)
			.then(() => setRefreshing(false));
	};

	useEffect(() => {
		const internal = setInterval(update, 30000);
		return () => clearInterval(internal);
	});
	useEffect(update, []);

	return (
		<>
			<Text style={{textAlign: "center", fontSize: 20, padding: 8}}>
				{getStr("wentuTitle")}
			</Text>
			<FlatList
				data={wentuState}
				refreshControl={<RefreshControl refreshing={refreshing} />}
				onRefresh={update}
				refreshing={refreshing}
				renderItem={({item}) => (
					<View style={{flexDirection: "row"}}>
						<Text style={styles.item}>{item[0]}</Text>
						<Text style={styles.item}>{`${item[2]}/${item[1] + item[2]}`}</Text>
					</View>
				)}
				keyExtractor={(item) => item[0]}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	item: {
		flex: 1,
		fontSize: 16,
		textAlign: "center",
		padding: 4,
	},
});
