import {FlatList, RefreshControl, Text} from "react-native";
import React, {useEffect, useState} from "react";
import {connect} from "react-redux";
import {currState, helper, State} from "../../redux/store";
import {ADD_REPORT_HIDDEN, REMOVE_REPORT_HIDDEN} from "../../redux/constants";
import {getStr} from "../../utils/i18n";
import {SettingsSwitch} from "../../components/settings/items";
import {NetworkRetry} from "../../components/easySnackbars";
import themes from "../../assets/themes/themes";
import {useColorScheme} from "react-native-appearance";

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
	const [refreshing, setRefreshing] = useState(true);

	const themeName = useColorScheme();
	const theme = themes[themeName];

	useEffect(() => {
		const {bx, newGPA} = currState().config;
		Promise.all([
			helper.getReport(bx, newGPA, 1),
			helper.getReport(bx, newGPA, 2),
			helper.getReport(bx, newGPA, 3),
		])
			.then(([x, y, z]) => x.concat(y).concat(z))
			.then((r) => {
				setLessons([...new Set(r.map((it) => it.name))]);
			})
			.catch(NetworkRetry)
			.then(() => setRefreshing(false));
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
					iconOn={undefined}
					iconOff={undefined}
				/>
			)}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					colors={[theme.colors.accent]}
				/>
			}
			style={{paddingVertical: 10, paddingLeft: 0, paddingRight: 3}}
			keyExtractor={(item) => item}
			ListFooterComponent={
				<Text
					style={{
						textAlign: "center",
						margin: 20,
						lineHeight: 18,
						fontSize: 14,
						color: "gray",
					}}>
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
