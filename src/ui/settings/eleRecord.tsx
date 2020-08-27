import {FlatList, RefreshControl, Text, View} from "react-native";
import React, {useEffect, useState} from "react";
import {getElePayRecord} from "../../network/dorm";
import {getStr} from "../../utils/i18n";
import Snackbar from "react-native-snackbar";

export const EleRecordScreen = () => {
	const [data, setData] = useState<
		[string, string, string, string, string, string][]
	>([]);
	const [refreshing, setRefreshing] = useState(false);

	const refresh = () => {
		setRefreshing(true);
		getElePayRecord()
			.then(setData)
			.catch(() =>
				Snackbar.show({
					text: getStr("networkRetry"),
					duration: Snackbar.LENGTH_SHORT,
				}),
			)
			.then(() => setRefreshing(false));
	};
	useEffect(refresh, []);

	return (
		<FlatList
			data={data}
			refreshing={refreshing}
			refreshControl={<RefreshControl refreshing={refreshing} />}
			onRefresh={refresh}
			renderItem={({item}) => {
				// const [name, id, time, channel, value, status] = item;
				const time = item[2];
				const value = item[4];
				const status = item[5];
				return (
					<View
						style={{
							padding: 10,
							flexDirection: "row",
							justifyContent: "space-between",
						}}>
						<View style={{flex: 2, alignItems: "flex-start"}}>
							<Text style={{fontSize: 16}}>{status}</Text>
							<Text style={{color: "grey"}}>{time}</Text>
						</View>
						<View style={{flex: 1, alignItems: "flex-end"}}>
							<Text style={{fontSize: 20}}>{value}</Text>
						</View>
					</View>
				);
			}}
			keyExtractor={(item) => item[1]}
			ListFooterComponent={
				<Text style={{padding: 10, textAlign: "center"}}>
					{getStr("eleRecordRestriction")}
				</Text>
			}
		/>
	);
};
