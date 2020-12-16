import {
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import React, {useContext, useEffect, useRef, useState} from "react";
import {connect} from "react-redux";
import {State} from "../../redux/store";
import {
	primaryScheduleThunk,
	secondaryScheduleThunk,
} from "../../redux/actions/schedule";
import {
	Exam,
	Lesson,
	LessonType,
	matchHiddenRules,
} from "../../models/schedule/schedule";
import {Col, Grid, Row} from "react-native-easy-grid";
import {Calendar} from "../../utils/calendar";
import {ScheduleNav} from "./scheduleStack";
import {getStr} from "../../utils/i18n";
import Icon from "react-native-vector-icons/FontAwesome";
import ViewShot from "react-native-view-shot";
import {saveImg} from "../../utils/saveImg";
import Snackbar from "react-native-snackbar";
import {
	Menu,
	MenuOption,
	MenuOptions,
	MenuTrigger,
	renderers,
} from "react-native-popup-menu";
import {SCHEDULE_DEL_OR_HIDE} from "../../redux/constants";
import {ThemeContext} from "../../assets/themes/context";
import themes from "../../assets/themes/themes";
import {Choice} from "src/redux/reducers/schedule";

const {SlideInMenu} = renderers;

interface ScheduleProps {
	readonly primary: Lesson[];
	readonly secondary: Lesson[];
	readonly custom: Lesson[];
	readonly exam: Exam[];
	readonly cache: string;
	readonly primaryRefreshing: boolean;
	readonly secondaryRefreshing: boolean;
	readonly shortenMap: {[key: string]: string};
	readonly hiddenRules: Lesson[];
	readonly unitHeight: number;
	getPrimary: () => void;
	getSecondary: () => void;
	delOrHide: DelOrHide;
	navigation: ScheduleNav;
}

const headerSpan = 0.5;

type DelOrHide = ([lesson, choice]: [Lesson, Choice]) => void;

const GridRow = ({
	span,
	text,
	overlaps,
	name,
	delOrHide,
	unitHeight,
}: {
	span?: number;
	text?: React.ReactText;
	overlaps?: Lesson[];
	name?: string;
	delOrHide?: DelOrHide;
	unitHeight: number;
}) => {
	const row = (
		<Row
			style={[
				styles.center,
				{
					height:
						(span || 1) >= 0.9
							? (span || 1) * unitHeight
							: Math.max((span || 1) * unitHeight, 45),
				},
			]}>
			{text && <Text style={{textAlign: "center"}}>{text}</Text>}
		</Row>
	);
	return overlaps && delOrHide && name ? (
		<Menu name={name} renderer={SlideInMenu} onSelect={delOrHide}>
			<MenuTrigger>{row}</MenuTrigger>
			<MenuOptions customStyles={{optionText: styles.menuOption}}>
				{overlaps.flatMap((lesson, index) => {
					const prefix = getStr(
						lesson.type === LessonType.CUSTOM ? "delete" : "hide",
					);
					return [
						<MenuOption
							value={[lesson, Choice.ONCE]}
							key={index * 3}
							text={`${prefix} ${lesson.title}${getStr("scheduleOnce")}`}
						/>,
						<MenuOption
							value={[lesson, Choice.REPEAT]}
							key={index * 3 + 1}
							text={`${prefix} ${lesson.title}${getStr("scheduleRepeat")}`}
						/>,
						<MenuOption
							value={[lesson, Choice.ALL]}
							key={index * 3 + 2}
							text={`${prefix} ${lesson.title}${getStr("scheduleAll")}`}
						/>,
					];
				})}
			</MenuOptions>
		</Menu>
	) : (
		row
	);
};

const GridColumn = ({
	day,
	week,
	lessons,
	shorten,
	setOverlap,
	delOrHide,
	unitHeight,
}: {
	day: number;
	week: number;
	lessons: Lesson[];
	shorten: {[_: string]: string};
	setOverlap: React.Dispatch<React.SetStateAction<boolean>>;
	delOrHide: DelOrHide;
	unitHeight: number;
}) => {
	const record = new Array<Lesson>(14);
	const result = [
		<GridRow
			key={0}
			span={headerSpan}
			text={`${new Calendar(week, day).format("MM.DD")}\n${
				getStr("dayOfWeek")[day]
			}`}
			unitHeight={unitHeight}
		/>,
	];
	for (let i = 1; i <= 14; i++) {
		if (record[i - 1] === undefined) {
			const valid = lessons.filter(
				(lesson) => lesson.begin <= i && i <= lesson.end,
			);
			if (valid.length === 0) {
				result.push(<GridRow key={i} unitHeight={unitHeight} />);
			} else {
				const {begin, end, title, locale} = valid[0];
				if (i !== begin) {
					// TODO: this method of detecting overlaps is probably wrong.
					setOverlap(true);
				}
				result.push(
					<GridRow
						key={i}
						text={`${title in shorten ? shorten[title] : title}${
							locale ? "@" : ""
						}${locale}`}
						span={end - i + 1}
						overlaps={lessons.filter(
							(lesson) =>
								(begin <= lesson.begin && lesson.begin <= end) ||
								(begin <= lesson.end && lesson.end <= end),
						)}
						name={`${day}.${i}`}
						delOrHide={delOrHide}
						unitHeight={unitHeight}
					/>,
				);
				for (let j = i - 1; j < end; j++) {
					record[j] = valid[0];
				}
			}
		}
	}
	return <Col size={2}>{result}</Col>;
};

const OptionButton = ({
	onPress,
	title,
}: {
	onPress: () => void;
	title: React.ReactText;
}) => {
	const themeName = useContext(ThemeContext);
	const theme = themes[themeName];
	return (
		<TouchableOpacity
			onPress={onPress}
			style={{
				flex: 1,
				backgroundColor: theme.colors.accent,
				padding: 8,
				margin: 2,
				borderRadius: 5,
				justifyContent: "center",
			}}>
			<Text style={{textAlign: "center", color: "white"}}>{title}</Text>
		</TouchableOpacity>
	);
};

const ScheduleUI = (props: ScheduleProps) => {
	const [week, setWeek] = useState(new Calendar().weekNumber);

	const [overlap, setOverlap] = useState(false);

	const viewShot = useRef<ViewShot>(null);

	const themeName = useContext(ThemeContext);
	const theme = themes[themeName];

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

	useEffect(() => {
		if (overlap) {
			Snackbar.show({
				text: getStr("scheduleOverlapWarning"),
				duration: Snackbar.LENGTH_SHORT,
			});
		}
	}, [overlap]);

	return (
		<>
			<View
				style={{
					padding: 10,
					justifyContent: "space-between",
					alignItems: "center",
					flexDirection: "row",
				}}>
				<TouchableOpacity
					onPress={() => setWeek((o) => (o > 1 ? o - 1 : o))}
					disabled={week <= 1}
					style={{padding: 8}}>
					<Icon
						name="chevron-left"
						size={24}
						color={week > 1 ? "black" : "#888"}
					/>
				</TouchableOpacity>
				<Text
					onPress={() => setWeek(new Calendar().weekNumber)}
					style={{
						fontSize: 18,
						textAlign: "center",
						flex: 1,
					}}>
					{week}
				</Text>
				<TouchableOpacity
					onPress={() =>
						setWeek((o) => (week < Calendar.weekCount ? o + 1 : o))
					}
					disabled={week >= Calendar.weekCount}
					style={{padding: 8}}>
					<Icon
						name="chevron-right"
						size={24}
						color={week < Calendar.weekCount ? "black" : "#888"}
					/>
				</TouchableOpacity>
			</View>
			<ScrollView
				refreshControl={
					<RefreshControl
						refreshing={props.primaryRefreshing || props.secondaryRefreshing}
						onRefresh={() => {
							props.getPrimary();
							props.getSecondary();
						}}
						colors={[theme.colors.accent]}
					/>
				}>
				<ViewShot ref={viewShot}>
					<Grid style={{backgroundColor: "white"}}>
						<Col size={1}>
							<GridRow span={headerSpan} unitHeight={props.unitHeight} />
							{Array.from(new Array(14), (_, id) => (
								<GridRow key={id} text={id + 1} unitHeight={props.unitHeight} />
							))}
						</Col>
						{Array.from(new Array(7), (_, id) => (
							<GridColumn
								key={id}
								day={id + 1}
								week={week}
								lessons={props.primary
									.concat(props.secondary)
									.filter((it) => !matchHiddenRules(it, props.hiddenRules))
									.concat(props.custom)
									.concat(
										props.exam.map((e) => ({
											type: LessonType.PRIMARY,
											title: "[考试]" + e.title,
											locale: "当前版本暂不支持显示地点",
											week: e.week,
											dayOfWeek: e.dayOfWeek,
											begin: e.begin,
											end: e.end,
										})),
									)
									.filter(
										(lesson) =>
											lesson.dayOfWeek === id + 1 && lesson.week === week,
									)}
								shorten={props.shortenMap}
								setOverlap={setOverlap}
								delOrHide={props.delOrHide}
								unitHeight={props.unitHeight}
							/>
						))}
					</Grid>
				</ViewShot>
			</ScrollView>
			<View style={{flexDirection: "row"}}>
				<OptionButton
					title={getStr("scheduleCustomShorten")}
					onPress={() => props.navigation.navigate("ScheduleShorten")}
				/>
				<OptionButton
					title={getStr("scheduleAddCustom")}
					onPress={() => props.navigation.navigate("ScheduleAdd")}
				/>
				<OptionButton
					title={getStr("scheduleSaveImg")}
					onPress={() => {
						// @ts-ignore
						viewShot.current.capture().then(saveImg);
					}}
				/>
				<OptionButton
					title={getStr("scheduleHidden")}
					onPress={() => props.navigation.navigate("ScheduleHidden")}
				/>
			</View>
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
	menuOption: {
		textAlign: "center",
		padding: 10,
	},
});

export const ScheduleScreen = connect(
	(state: State) => ({
		...state.schedule,
		unitHeight:
			state.config.scheduleHeight > 10 ? state.config.scheduleHeight : 10,
	}),
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
			delOrHide: ([lesson, choice]: [Lesson, Choice]) => {
				dispatch({type: SCHEDULE_DEL_OR_HIDE, payload: [lesson, choice]});
			},
		};
	},
)(ScheduleUI);
