import {FlatList, Text} from "react-native";
import React, {useEffect, useState} from "react";
import {connect} from "react-redux";
import {State} from "../../redux/store";
import {ADD_REPORT_HIDDEN, REMOVE_REPORT_HIDDEN} from "../../redux/constants";
import {getReport} from "../../network/basics";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import {SettingsSwitch} from "../../components/settings/items";

const ReportManageHiddenUI = ({
	hidden,
	add,
	remove,
}: {
	hidden: string[];
	add: (payload: string) => void;
	remove: (payload: string) => void;
}) => {
	const [lessons, setLessons] = useState<string[]>([]);

	useEffect(() => {
		getReport()
			.then((r) => {
				setLessons([...new Set(r.map((it) => it.name))]);
			})
			.catch(() =>
				Snackbar.show({
					text: getStr("networkRetry"),
					duration: Snackbar.LENGTH_SHORT,
				}),
			);
	}, []);

	return (
		<FlatList
			data={lessons}
			renderItem={({item}) => (
				<SettingsSwitch
					textOn={item}
					textOff={item}
					onValueChange={(state) => (state ? add(item) : remove(item))}
					defaultValue={hidden.indexOf(item) !== -1}
				/>
			)}
			keyExtractor={(item) => item}
			ListFooterComponent={
				<Text style={{textAlign: "center", padding: 10}}>
					{getStr("reportHiddenWarning")}
				</Text>
			}
		/>
	);
};

export const ReportManageHiddenScreen = connect(
	(state: State) => ({
		hidden: state.config.reportHidden ?? [],
	}),
	(dispatch) => ({
		add: (payload: string) => dispatch({type: ADD_REPORT_HIDDEN, payload}),
		remove: (payload: string) =>
			dispatch({type: REMOVE_REPORT_HIDDEN, payload}),
	}),
)(ReportManageHiddenUI);
