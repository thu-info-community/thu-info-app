import {FlatList, Text, View} from "react-native";
import React, {useEffect, useState} from "react";
import {getPhysicalExamResult} from "../../network/basics";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";

export const PhysicalExamScreen = () => {
	const [result, setResult] = useState<[string, string][]>([]);
	useEffect(() => {
		getPhysicalExamResult()
			.then(setResult)
			.catch(() =>
				Snackbar.show({
					text: getStr("networkRetry"),
					duration: Snackbar.LENGTH_SHORT,
				}),
			);
	}, []);
	return (
		<FlatList
			data={result}
			renderItem={({item}) => (
				<View style={{flexDirection: "row"}}>
					<Text style={{flex: 1, textAlign: "right", padding: 4}}>
						{item[0]}
					</Text>
					<Text style={{flex: 1, textAlign: "left", padding: 4}}>
						{item[1]}
					</Text>
				</View>
			)}
			keyExtractor={([x]) => x}
		/>
	);
};
