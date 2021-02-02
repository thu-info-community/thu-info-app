import React, {useEffect, useState} from "react";
import {RefreshControl, SectionList, SectionListData} from "react-native";
import {
	ReportFooter,
	ReportHeader,
	ReportHeaderProps,
	ReportItem,
} from "../../components/home/report";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import themes from "../../assets/themes/themes";
import {connect} from "react-redux";
import {currState, helper, State} from "../../redux/store";
import {Course} from "thu-info-lib/lib/models/home/report";
import {useColorScheme} from "react-native-appearance";

export const semesterWeight = (semester: string): number => {
	const year = Number(semester.slice(0, 4));
	let term: number;
	switch (semester[5]) {
		case "春":
			term = 0;
			break;
		case "夏":
			term = 1;
			break;
		case "秋":
			term = 2;
			break;
		default:
			term = 3;
	}
	return year * 10 + term;
};

type Section = SectionListData<Course> & ReportHeaderProps;

// totalCredits <= allCredits
const prepareData = (
	src: Course[],
): {
	gpa: number;
	totalCredits: number;
	allCredits: number;
	totalPoints: number;
	sections: Section[];
} => {
	const semesters = new Set(src.map((course) => course.semester));
	const sortedSemesters = [...semesters].sort(
		(a, b) => semesterWeight(a) - semesterWeight(b),
	);
	let totalCredits = 0;
	let totalPoints = 0;
	let allCredits = 0;
	const sections = sortedSemesters.map((semester) => {
		const courses = src.filter((course) => course.semester === semester);
		const credits = courses.reduce(
			(acc, course) => acc + (isNaN(course.point) ? 0 : course.credit),
			0,
		);
		const points = courses.reduce(
			(acc, course) =>
				acc + (isNaN(course.point) ? 0 : course.point * course.credit),
			0,
		);
		totalCredits += credits;
		totalPoints += points;
		allCredits += courses.reduce(
			(acc, course) =>
				acc +
				(isNaN(course.credit) ||
				![
					"A+",
					"A",
					"A-",
					"B+",
					"B",
					"B-",
					"C+",
					"C",
					"C-",
					"D+",
					"D",
					"P",
				].includes(course.grade)
					? 0
					: course.credit),
			0,
		);
		return {
			semester,
			gpa: points / credits,
			data: courses,
		};
	});
	return {
		gpa: totalPoints / totalCredits,
		sections,
		allCredits,
		totalCredits,
		totalPoints,
	};
};

const ReportUI = ({hidden}: {hidden: string[]}) => {
	const [report, setReport] = useState<Course[]>();
	const [refreshing, setRefreshing] = useState(true);

	const themeName = useColorScheme();
	const theme = themes[themeName];

	const {graduate, bx, newGPA} = currState().config;

	const fetchData = () => {
		setRefreshing(true);
		helper
			.getReport(graduate, bx, newGPA)
			.then((res) => {
				setReport(res.filter((it) => hidden.indexOf(it.name) === -1));
				setRefreshing(false);
			})
			.catch(() => {
				Snackbar.show({
					text: getStr("networkRetry"),
					duration: Snackbar.LENGTH_SHORT,
				});
				setRefreshing(false);
			});
	};

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(fetchData, []);

	const {gpa, sections, allCredits, totalCredits, totalPoints} = prepareData(
		report || [],
	);

	return (
		<SectionList
			sections={sections}
			stickySectionHeadersEnabled={true}
			renderSectionHeader={({section}) => (
				<ReportHeader semester={section.semester} gpa={section.gpa} />
			)}
			renderItem={({item}) => (
				<ReportItem
					name={item.name}
					credit={item.credit}
					grade={item.grade}
					point={item.point}
				/>
			)}
			ListFooterComponent={
				<ReportFooter
					gpa={gpa}
					totalCredits={totalCredits}
					allCredits={allCredits}
					totalPoints={totalPoints}
				/>
			}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={fetchData}
					colors={[theme.colors.accent]}
				/>
			}
			keyExtractor={(item, index) => `${item.semester}${index}`}
		/>
	);
};

export const ReportScreen = connect((state: State) => ({
	hidden: state.config.reportHidden ?? [],
}))(ReportUI);
