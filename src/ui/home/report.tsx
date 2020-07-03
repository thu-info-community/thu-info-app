import React, {useEffect, useState} from "react";
import {getReport} from "../../network/basics";
import {Course, semesterWeight} from "../../models/home";
import {SectionList, SectionListData} from "react-native";
import {
	ReportFooter,
	ReportHeader,
	ReportHeaderProps,
	ReportItem,
} from "../../components/home/report";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";

interface Section extends SectionListData<Course>, ReportHeaderProps {}

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

export const ReportScreen = () => {
	const [report, setReport] = useState<Course[]>();
	const [refreshing, setRefreshing] = useState(true);

	const fetchData = () => {
		setRefreshing(true);
		getReport()
			.then((res) => {
				setReport(res);
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

	useEffect(fetchData, []);

	const [gpa, sections] = prepareData(report || []);

	return (
		<SectionList
			sections={sections}
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
			refreshing={refreshing}
			onRefresh={fetchData}
			keyExtractor={(item, index) => `${item.semester}${index}`}
		/>
	);
};
