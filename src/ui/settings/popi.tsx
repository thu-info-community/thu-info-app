import React, {useEffect, useState} from "react";
import {FlatList, Text, View} from "react-native";
import {retrieve} from "../../network/core";
import {POPI_URL} from "../../constants/strings";

export const PopiScreen = () => {
	const [data, setData] = useState<[string, string][]>([]);

	useEffect(() => {
		retrieve(POPI_URL).then(JSON.parse).then(setData);
	}, []);

	return (
		<FlatList
			data={data}
			renderItem={({item}) => (
				<View style={{padding: 10}}>
					<Text>{item[0]}</Text>
					<View style={{backgroundColor: "grey", height: 1}} />
					<Text>{item[1]}</Text>
				</View>
			)}
			keyExtractor={(item) => item[0]}
		/>
	);
};
