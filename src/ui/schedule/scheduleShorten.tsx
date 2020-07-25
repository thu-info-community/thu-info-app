import React from "react";
import {FlatList, Text, TextInput, View} from "react-native";
import {connect} from "react-redux";
import {State} from "../../redux/store";
import {SCHEDULE_UPDATE_ALIAS} from "../../redux/constants";

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
			renderItem={({item}) => (
				<View style={{flexDirection: "row"}}>
					<Text
						numberOfLines={1}
						style={{fontSize: 16, flex: 1, textAlign: "left"}}>
						{item[0]}
					</Text>
					<TextInput
						numberOfLines={1}
						style={{fontSize: 16, flex: 1, textAlign: "right"}}
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
