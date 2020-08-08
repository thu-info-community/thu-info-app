import React, {useState} from "react";
import {FlatList, StyleSheet, Text, View} from "react-native";
import {getExpenditures} from "../../network/basics";
import {Record} from "../../models/home/expenditure";

export const ExpenditureScreen = () => {
	const [expenditures, setExpenditures] = useState<Record[]>([]);
	getExpenditures("2019-12-20", "2019-12-30").then(setExpenditures);
	return (
		<View style={styles.container}>
			<FlatList
				data={expenditures}
				renderItem={({item}) => (
					<Text>{(item.value >= 0 ? "+" : "") + item.value.toFixed(2)}</Text>
				)}
				keyExtractor={(item, index) => `${index}`}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		letterSpacing: 12,
	},
});
