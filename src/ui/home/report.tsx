import React, {useEffect, useState} from "react";
import {
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import themes from "../../assets/themes/themes";
import {helper} from "../../redux/store";
import {Course} from "thu-info-lib/dist/models/home/report";
import {useColorScheme} from "react-native";
import {RoundedView} from "../../components/views";

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

const gpaToStr = (gpa: number, dig: number) =>
	isNaN(gpa) ? "N/A" : gpa.toFixed(dig);

const gradeToColor: {[key: string]: string} = {
	"A+": "#8B55E4",
	A: "#5856D6",
	"A-": "#007AFF",
	"B+": "#32ADE6",
	B: "#00C7BE",
	"B-": "#34C759",
	"C+": "#98C734",
	C: "#FFCC00",
	"C-": "#FF9500",
	"D+": "#B8831C",
	D: "#DE970E",
	P: "#8B55E4",
	F: "#FF3B30",
	W: "#C7C7CC",
	I: "#FF3B30",
	EX: "#00C7BE",
};

type Section = {
	semester: string;
	gpa: number;
	totalCredits: number;
	allCredits: number;
	totalPoints: number;
	data: Course[];
};

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
		const allCreditsPerSection = courses.reduce(
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
		allCredits += allCreditsPerSection;
		return {
			semester,
			gpa: points / credits,
			totalCredits: credits,
			allCredits: allCreditsPerSection,
			totalPoints: points,
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

const ReportIcon = ({grade}: {grade: string}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<View
			style={{
				marginRight: 8,
				alignItems: "center",
				justifyContent: "center",
				width: 24,
				height: 24,
				borderStyle: ["P", "W", "I", "EX"].includes(grade) ? "dashed" : "solid",
				borderRadius: 12,
				borderWidth: 1.5,
				borderColor: grade in gradeToColor ? gradeToColor[grade] : "#A6A6A6",
				flexDirection: "row",
			}}>
			<Text
				style={{
					fontSize: 16,
					color: colors.text,
				}}>
				{grade[0]}
			</Text>
			{grade[1] === "X" ? (
				<Text
					style={{
						fontSize: 12,
						color: colors.text,
					}}>
					X
				</Text>
			) : grade.length > 1 ? (
				<Text
					style={{
						fontSize: 12,
						color: colors.text,
						lineHeight: 12,
					}}>
					{grade[1]}
				</Text>
			) : null}
		</View>
	);
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
		<View style={{marginHorizontal: 12, flex: 1}}>
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
			<ScrollView
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={fetchData}
						colors={[theme.colors.accent]}
					/>
				}>
				<View>
					<RoundedView style={{marginBottom: 16}}>
						<Text
							style={{
								fontSize: 16,
								fontWeight: "bold",
								color: theme.colors.text,
								textAlign: "center",
							}}>
							{getStr("allGPA")}
							{gpaToStr(gpa, 3)}
						</Text>
						<Text
							style={{
								fontSize: 12,
								color: theme.colors.fontB2,
								textAlign: "center",
							}}>
							{getStr("allCredits")}:{allCredits}
							{"   "}
							{getStr("totalCredits")}:{totalCredits}
							{"   "}
							{getStr("totalPoints")}:{gpaToStr(totalPoints, 1)}
						</Text>
					</RoundedView>
					{sections.map((section) => (
						<RoundedView key={section.semester} style={{marginBottom: 16}}>
							<View style={{flexDirection: "row", marginHorizontal: 12}}>
								<Text
									numberOfLines={1}
									style={{
										fontSize: 16,
										fontWeight: "bold",
										color: theme.colors.text,
										flex: 1,
									}}>
									{section.semester}
								</Text>
								<Text
									numberOfLines={1}
									style={{
										fontSize: 16,
										fontWeight: "bold",
										color: theme.colors.text,
										flex: 0,
									}}>
									{gpaToStr(section.gpa, 3)}
								</Text>
							</View>
							<View
								style={{
									flexDirection: "row",
									marginHorizontal: 12,
									marginTop: 4,
									marginBottom: 8,
								}}>
								<Text style={{fontSize: 12, color: theme.colors.fontB2}}>
									{getStr("allCredits")}:{section.allCredits}
									{"  "}
									{getStr("totalCredits")}:{section.totalCredits}
									{"  "}
									{getStr("totalPoints")}:{gpaToStr(section.totalPoints, 1)}
								</Text>
							</View>
							{section.data.map((course, index) => (
								<>
									{index > 0 && (
										<View
											style={{
												height: 0.5,
												marginHorizontal: 16,
												backgroundColor: theme.colors.fontB3,
											}}
										/>
									)}
									<View
										style={{
											flexDirection: "row",
											marginHorizontal: 16,
											marginVertical: 8,
										}}>
										<ReportIcon grade={course.grade} />
										<Text
											numberOfLines={1}
											style={{fontSize: 16, flex: 2, color: theme.colors.text}}>
											{course.name}
										</Text>
										<Text
											numberOfLines={1}
											style={{
												fontSize: 16,
												flex: 0,
												color: theme.colors.fontB2,
											}}>
											{course.credit}
											{" pts · "}
											{gpaToStr(course.point, 1)}
										</Text>
									</View>
								</>
							))}
						</RoundedView>
					))}
				</View>
			</ScrollView>
		</View>
	);
};
