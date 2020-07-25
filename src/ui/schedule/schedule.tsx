import {
	Button,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
} from "react-native";
import React, {useEffect} from "react";
import {connect} from "react-redux";
import {State} from "../../redux/store";
import {
	primaryScheduleThunk,
	secondaryScheduleThunk,
} from "../../redux/actions/schedule";
import {Exam, Lesson} from "../../models/schedule/schedule";
import {Col, Row, Grid} from "react-native-easy-grid";
import {Calendar} from "../../utils/calendar";
import {ScheduleNav} from "./scheduleStack";
import {getStr} from "../../utils/i18n";

interface ScheduleProps {
	readonly primary: Lesson[];
	readonly secondary: Lesson[];
	readonly exam: Exam[];
	readonly cache: string;
	readonly primaryRefreshing: boolean;
	readonly secondaryRefreshing: boolean;
	readonly shortenMap: {[key: string]: string};
	getPrimary: () => void;
	getSecondary: () => void;
	navigation: ScheduleNav;
}

const headerSpan = 0.3;
const unitHeight = 90;

const GridRow = (props: {span?: number; text?: React.ReactText}) => (
	<Row style={[styles.center, {height: (props.span || 1) * unitHeight}]}>
		{props.text ? <Text>{props.text}</Text> : null}
	</Row>
);

const GridColumn = ({
	day,
	lessons,
	shorten,
}: {
	day: number;
	lessons: Lesson[];
	shorten: {[_: string]: string};
}) => {
	const record = new Array<Lesson>(14);
	const result = [<GridRow key={0} span={headerSpan} text={day} />];
	for (let i = 1; i <= 14; i++) {
		if (record[i - 1] === undefined) {
			const valid = lessons.filter(
				(lesson) => lesson.begin <= i && i <= lesson.end,
			);
			if (valid.length === 0) {
				result.push(<GridRow key={i} />);
			} else {
				result.push(
					<GridRow
						key={i}
						text={`${
							valid[0].title in shorten
								? shorten[valid[0].title]
								: valid[0].title
						}@${valid[0].locale}`}
						span={valid[0].end - valid[0].begin + 1}
					/>,
				);
				for (let j = i - 1; j < valid[0].end; j++) {
					record[j] = valid[0];
				}
			}
		}
	}
	return <Col size={2}>{result}</Col>;
};

const ScheduleUI = (props: ScheduleProps) => {
	useEffect(() => {
		if (Calendar.semesterId !== props.cache) {
			console.log(
				"Schedule: Corresponding cache not found. Auto fetch from server.",
			);
			props.getPrimary();
			props.getSecondary();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.cache]);

	return (
		<>
			<ScrollView
				refreshControl={
					<RefreshControl
						refreshing={props.primaryRefreshing || props.secondaryRefreshing}
						onRefresh={() => {
							props.getPrimary();
							props.getSecondary();
						}}
					/>
				}>
				<Grid>
					<Col size={1}>
						<GridRow span={headerSpan} />
						{Array.from(new Array(14), (_, id) => (
							<GridRow key={id} text={id + 1} />
						))}
					</Col>
					{Array.from(new Array(7), (_, id) => (
						<GridColumn
							key={id}
							day={id + 1}
							lessons={props.primary.filter(
								(lesson) => lesson.dayOfWeek === id + 1,
							)}
							shorten={props.shortenMap}
						/>
					))}
				</Grid>
			</ScrollView>
			<Button
				title={getStr("scheduleCustomShorten")}
				onPress={() => props.navigation.navigate("ScheduleShorten")}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 3,
		borderWidth: 0.5,
		borderColor: "black",
	},
});

export const ScheduleScreen = connect(
	(state: State) => state.schedule,
	(dispatch) => {
		return {
			getPrimary: () => {
				// @ts-ignore
				dispatch(primaryScheduleThunk());
			},
			getSecondary: () => {
				// @ts-ignore
				dispatch(secondaryScheduleThunk());
			},
		};
	},
)(ScheduleUI);
