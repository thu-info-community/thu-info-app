import React, {useEffect, useState} from "react";
import {
	RefreshControl,
	SectionList,
	SectionListData,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import {
	ReportFooter,
	ReportHeader,
	ReportHeaderProps,
	ReportItem,
} from "../../components/home/report";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import themes from "../../assets/themes/themes";
import {helper} from "../../redux/store";
import {Course} from "thu-info-lib/dist/models/home/report";
import {useColorScheme} from "react-native";

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
					"EX",
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
		sections: sections.reverse(),
		allCredits,
		totalCredits,
		totalPoints,
	};
};

export const ReportScreen = () => {
	const [report, setReport] = useState<Course[]>();
	const [refreshing, setRefreshing] = useState(true);

	const [flag, setFlag] = useState<1 | 2 | 3>(1);
	const [bx, setBx] = useState(false);

	const themeName = useColorScheme();
	const theme = themes(themeName);

	const fetchData = () => {
		setRefreshing(true);
		helper
			.getReport(bx && flag === 1, true, flag)
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

	useEffect(fetchData, [bx, flag]);

	const {gpa, sections, allCredits, totalCredits, totalPoints} = prepareData(
		report || [],
	);

	return (
		<>
			<View style={{flexDirection: "row", margin: 5}}>
				<TouchableOpacity
					style={{padding: 6, flex: 1}}
					onPress={() => setFlag(1)}>
					<Text
						style={{
							color: flag === 1 ? "blue" : theme.colors.text,
							textAlign: "center",
						}}>
						{getStr("reportFlag1")}
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={{padding: 6, flex: 1}}
					onPress={() => setFlag(2)}>
					<Text
						style={{
							color: flag === 2 ? "blue" : theme.colors.text,
							textAlign: "center",
						}}>
						{getStr("reportFlag2")}
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={{padding: 6, flex: 1}}
					onPress={() => setFlag(3)}>
					<Text
						style={{
							color: flag === 3 ? "blue" : theme.colors.text,
							textAlign: "center",
						}}>
						{getStr("reportFlag3")}
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={{padding: 6, flex: 1}}
					onPress={() => setBx((o) => !o)}>
					<Text style={{color: "blue", textAlign: "center"}}>
						{getStr(bx ? "bx" : "bxr")}
					</Text>
				</TouchableOpacity>
			</View>
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
		</>
	);
};
