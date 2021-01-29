import React, {useEffect, useState} from "react";
import {getReport} from "../../network/basics";
import {Course, semesterWeight} from "../../models/home/report";
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
import {State} from "../../redux/store";
import {useColorScheme} from "react-native-appearance";

type Section = SectionListData<Course> & ReportHeaderProps;

const prepareData = (src: Course[]): [number, Section[]] => {
	const semesters = new Set(src.map((course) => course.semester));
	const sortedSemesters = [...semesters].sort(
		(a, b) => semesterWeight(a) - semesterWeight(b),
	);
	let totalCredits = 0;
	let totalPoints = 0;
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
		return {
			semester,
			gpa: points / credits,
			data: courses,
		};
	});
	return [totalPoints / totalCredits, sections];
};

const ReportUI = ({hidden}: {hidden: string[]}) => {
	const [report, setReport] = useState<Course[]>();
	const [refreshing, setRefreshing] = useState(true);

	const themeName = useColorScheme();
	const theme = themes[themeName];

	const fetchData = () => {
		setRefreshing(true);
		getReport()
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

	const [gpa, sections] = prepareData(report || []);

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
			ListFooterComponent={<ReportFooter gpa={gpa} />}
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
