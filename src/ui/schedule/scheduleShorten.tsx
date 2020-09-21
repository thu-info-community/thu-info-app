import React from "react";
import {FlatList, Text, TextInput, View} from "react-native";
import {connect} from "react-redux";
import {State} from "../../redux/store";
import {SCHEDULE_UPDATE_ALIAS} from "../../redux/constants";
import {getStr} from "src/utils/i18n";

interface ScheduleShortenProps {
	readonly shortenMap: [string, string][];
	readonly setAlias: (origin: string, dest: string) => void;
}

const ScheduleShortenUI = (props: ScheduleShortenProps) => {
	return (
		<FlatList
			data={props.shortenMap}
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
						defaultValue={item[1] === item[0] ? "" : item[1]}
						placeholder={item[0]}
						onChangeText={(text) => {
							if (text !== "") {
								props.setAlias(item[0], text);
							} else {
								props.setAlias(item[0], item[0]);
							}
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
		const o = state.schedule.shortenMap;
		const validLessons = new Set(
			state.schedule.primary
				.concat(state.schedule.secondary)
				.map((it) => it.title)
				.concat(state.schedule.exam.map((it) => it.title)),
		);
		return {
			shortenMap: Object.keys(o)
				.filter((key) => validLessons.has(key))
				.map((key) => [key, o[key]]) as [string, string][],
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
