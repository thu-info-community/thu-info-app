import React, {useEffect, useState} from "react";
import {Text, StyleSheet, View, ActivityIndicator} from "react-native";
import {getAssessmentForm} from "src/network/basics";
import {Form} from "src/models/home/assessment";
import Snackbar from "react-native-snackbar";
import {getStr} from "src/utils/i18n";
import {FlatList} from "react-native-gesture-handler";

export const FormScreen = ({route}: any) => {
	const name: string = route.params.name;
	const url: string = route.params.url;

	const [refreshing, setRefreshing] = useState(true);
	const [evaluationForm, setEvaluationForm] = useState<Form>();

	const fetchForm = (_url: string) => {
		setRefreshing(true);
		getAssessmentForm(_url)
			.then((res: Form) => {
				setEvaluationForm(res);
				setRefreshing(false);
			})
			.catch(() => {
				Snackbar.show({
					text: getStr("networkRetry"),
					duration: Snackbar.LENGTH_SHORT,
				});
				setRefreshing(false);
			});
	};

	useEffect(() => {
		fetchForm(url);
	}, [url]);

	return (
		<View style={styles.container}>
			<FlatList
				refreshing={refreshing}
				onRefresh={() => fetchForm(url)}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},

	activityIndicatorStyle: {
		alignSelf: "flex-start",
	},
});
