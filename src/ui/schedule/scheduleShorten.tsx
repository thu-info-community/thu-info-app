import React from "react";
import {FlatList, Text, TextInput, View} from "react-native";
import {connect} from "react-redux";
import {State} from "../../redux/store";
import {SCHEDULE_UPDATE_ALIAS} from "../../redux/constants";
import {getStr} from "src/utils/i18n";

interface ScheduleShortenProps {
	readonly shortenMap: {[key: string]: string};
	readonly setAlias: (origin: string, dest: string) => void;
}

const prepareData = (o: {[key: string]: string}) =>
	Object.keys(o).map((key) => [key, o[key]]);

const ScheduleShortenUI = (props: ScheduleShortenProps) => {
	return (
		<FlatList
			data={prepareData(props.shortenMap)}
			ListHeaderComponent={
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						marginHorizontal: 20,
						marginTop: 20,
						marginBottom: 10,
					}}>
					<Text
						numberOfLines={1}
						style={{
							fontSize: 18,
							flex: 1,
							textAlign: "center",
							fontWeight: "bold",
						}}>
						{getStr("courseName")}
					</Text>
					<Text
						numberOfLines={1}
						style={{
							fontSize: 18,
							flex: 1,
							textAlign: "center",
							fontWeight: "bold",
						}}>
						{getStr("courseNameShorten")}
					</Text>
				</View>
			}
			renderItem={({item}) => (
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						marginHorizontal: 20,
						marginTop: 10,
					}}>
					<Text
						numberOfLines={1}
						style={{fontSize: 15, flex: 1, textAlign: "center"}}>
						{item[0]}
					</Text>
					<TextInput
						numberOfLines={1}
						style={{
							fontSize: 15,
							flex: 1,
							backgroundColor: "white",
							textAlign: "left",
							borderColor: "lightgrey",
							borderWidth: 1,
							borderRadius: 5,
							padding: 6,
						}}
						defaultValue={item[1]}
						onChangeText={(text) => {
							props.setAlias(item[0], text);
						}}
					/>
				</View>
			)}
			keyExtractor={(item, index) => index.toString()}
		/>
	);
};

export const ScheduleShortenScreen = connect(
	(state: State) => {
		return {
			shortenMap: state.schedule.shortenMap,
		};
	},
	(dispatch) => {
		return {
			setAlias: (origin: string, dest: string) =>
				dispatch({
					type: SCHEDULE_UPDATE_ALIAS,
					payload: [origin, dest],
				}),
		};
	},
)(ScheduleShortenUI);
