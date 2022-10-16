import React, {useEffect, useRef, useState} from "react";
import {
	FlatList,
	Modal,
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
import IconDropdown from "../../assets/icons/IconDropdown";
import IconExchange from "../../assets/icons/IconExchange";
import IconCheck from "../../assets/icons/IconCheck";
import {
	GradeA,
	GradeAMinus,
	GradeAPlus,
	GradeB,
	GradeBMinus,
	GradeBPlus,
	GradeC,
	GradeCMinus,
	GradeCPlus,
	GradeD,
	GradeDPlus,
	GradeEX,
	GradeF,
	GradeI,
	GradeP,
	GradeW,
} from "../../assets/icons/IconGrades";
import {getStatusBarHeight} from "react-native-status-bar-height";

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

const cmp = (a: Course, b: Course) => {
	const grades = [
		"P",
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
		"F",
		"W",
		"I",
		"EX",
	];
	const gradeRankA = grades.indexOf(a.grade);
	const gradeRankB = grades.indexOf(b.grade);
	const semesterWeightA = semesterWeight(a.semester);
	const semesterWeightB = semesterWeight(b.semester);
	if (gradeRankA < gradeRankB) {
		return 1;
	} else if (gradeRankA > gradeRankB) {
		return -1;
	} else if (semesterWeightA > semesterWeightB) {
		return 1;
	} else if (semesterWeightA < semesterWeightB) {
		return -1;
	} else if (a.credit > b.credit) {
		return 1;
	} else if (a.credit < b.credit) {
		return -1;
	} else if (a.name > b.name) {
		return 1;
	} else if (a.name < b.name) {
		return -1;
	} else {
		return 0;
	}
};

const ReportIcon = ({grade}: {grade: string}) => {
	switch (grade) {
		case "A-":
			return <GradeAMinus />;
		case "A":
			return <GradeA />;
		case "A+":
			return <GradeAPlus />;
		case "B-":
			return <GradeBMinus />;
		case "B":
			return <GradeB />;
		case "B+":
			return <GradeBPlus />;
		case "C-":
			return <GradeCMinus />;
		case "C":
			return <GradeC />;
		case "C+":
			return <GradeCPlus />;
		case "D":
			return <GradeD />;
		case "D+":
			return <GradeDPlus />;
		case "EX":
			return <GradeEX />;
		case "F":
			return <GradeF />;
		case "I":
			return <GradeI />;
		case "P":
			return <GradeP />;
		case "W":
			return <GradeW />;
	}
	return null;
};

export const ReportScreen = () => {
	const [report, setReport] = useState<Course[]>([]);
	const [refreshing, setRefreshing] = useState(true);

	const [open, setOpen] = useState<"flag" | "bx" | undefined>(undefined);
	const [flag, setFlag] = useState<1 | 2 | 3>(1);
	const [bx, setBx] = useState(false);
	const [mode, setMode] = useState<"split" | "gather">("split");

	const [dropdownTop, setDropdownTop] = useState(0);
	const DropdownContainer = useRef<View>();

	const themeName = useColorScheme();
	const {colors} = themes(themeName);

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

	useEffect(() => {
		DropdownContainer.current?.measure((_x, y, _w, h) => {
			const newValue = y + h + getStatusBarHeight();
			if (!isNaN(newValue)) {
				setDropdownTop(newValue);
			}
		});
	}, [open]);

	const {gpa, sections, allCredits, totalCredits, totalPoints} =
		prepareData(report);

	const reportSorted =
		mode === "gather" ? [...report].sort((a, b) => -cmp(a, b)) : [];

	const dropdownData =
		open === undefined
			? []
			: open === "flag"
			? [getStr("reportFlag1"), getStr("reportFlag2"), getStr("reportFlag3")]
			: [getStr("bxr"), getStr("bx")];

	return (
		<View style={{flex: 1}}>
			<View
				// @ts-ignore
				ref={DropdownContainer}
				style={{
					flexDirection: "row",
					height: 32,
					alignItems: "center",
					backgroundColor: colors.contentBackground,
				}}>
				<TouchableOpacity
					onPress={() => setOpen((v) => (v === "flag" ? undefined : "flag"))}
					style={{
						marginLeft: 36,
						flexDirection: "row",
						alignItems: "center",
						flex: 0,
					}}>
					<Text
						style={{color: open === "flag" ? colors.primary : colors.fontB2}}>
						{getStr(`reportFlag${flag}`)}
					</Text>
					<View style={{marginLeft: 6}}>
						<IconDropdown
							width={6}
							height={4}
							color={open === "flag" ? colors.primary : colors.fontB2}
						/>
					</View>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() => setOpen((v) => (v === "bx" ? undefined : "bx"))}
					style={{
						marginLeft: 32,
						flexDirection: "row",
						alignItems: "center",
						flex: 0,
					}}>
					<Text style={{color: open === "bx" ? colors.primary : colors.fontB2}}>
						{getStr(bx ? "bx" : "bxr")}
					</Text>
					<View style={{marginLeft: 6}}>
						<IconDropdown
							width={6}
							height={4}
							color={open === "bx" ? colors.primary : colors.fontB2}
						/>
					</View>
				</TouchableOpacity>
				<View style={{flex: 1}} />
				<TouchableOpacity
					onPress={() => setMode((m) => (m === "split" ? "gather" : "split"))}
					style={{marginRight: 36, padding: 4, alignItems: "center", flex: 0}}>
					<IconExchange height={18} width={18} />
				</TouchableOpacity>
				<Modal visible={open !== undefined && dropdownTop > 0} transparent>
					<TouchableOpacity
						style={{
							width: "100%",
							height: "100%",
						}}
						onPress={() => setOpen(undefined)}>
						<View
							style={{
								position: "absolute",
								backgroundColor: colors.text,
								opacity: 0.3,
								width: "100%",
								top: dropdownTop,
								bottom: 0,
							}}
						/>
						<View
							style={{
								position: "absolute",
								backgroundColor: colors.contentBackground,
								width: "100%",
								top: dropdownTop,
								borderBottomStartRadius: 12,
								borderBottomEndRadius: 12,
							}}>
							<FlatList
								data={dropdownData}
								renderItem={({item, index}) => {
									const showTick =
										open === "flag" ? index + 1 === flag : (index === 1) === bx;
									return (
										<TouchableOpacity
											onPress={() => {
												setOpen((o) => {
													if (o === "flag") {
														switch (index) {
															case 1: {
																setFlag(2);
																break;
															}
															case 2: {
																setFlag(3);
																break;
															}
															default: {
																setFlag(1);
																break;
															}
														}
													} else {
														setBx(index === 1);
													}
													return undefined;
												});
											}}
											style={{
												paddingHorizontal: 16,
												marginVertical: 8,
												flexDirection: "row",
												justifyContent: "space-between",
											}}>
											<Text style={{color: colors.text, fontSize: 14}}>
												{item}
											</Text>
											{showTick ? <IconCheck height={18} width={18} /> : null}
										</TouchableOpacity>
									);
								}}
								keyExtractor={(item) => item}
							/>
						</View>
					</TouchableOpacity>
				</Modal>
			</View>
			<ScrollView
				style={{marginHorizontal: 12}}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={fetchData}
						colors={[colors.accent]}
					/>
				}>
				<View>
					<RoundedView style={{marginVertical: 16}}>
						<Text
							style={{
								fontSize: 16,
								fontWeight: "bold",
								color: colors.text,
								textAlign: "center",
							}}>
							{getStr("allGPA")}
							{gpaToStr(gpa, 3)}
						</Text>
						<Text
							style={{
								fontSize: 12,
								color: colors.fontB2,
								textAlign: "center",
							}}>
							{getStr("allCredits")}:{allCredits}
							{"   "}
							{getStr("totalCredits")}:{totalCredits}
							{"   "}
							{getStr("totalPoints")}:{gpaToStr(totalPoints, 1)}
						</Text>
					</RoundedView>
					{(mode === "split" ? sections : []).map((section) => (
						<RoundedView key={section.semester} style={{marginBottom: 16}}>
							<View style={{flexDirection: "row", marginHorizontal: 12}}>
								<Text
									numberOfLines={1}
									style={{
										fontSize: 16,
										fontWeight: "bold",
										color: colors.text,
										flex: 1,
									}}>
									{section.semester}
								</Text>
								<Text
									numberOfLines={1}
									style={{
										fontSize: 16,
										fontWeight: "bold",
										color: colors.text,
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
								<Text style={{fontSize: 12, color: colors.fontB2}}>
									{getStr("allCredits")}:{section.allCredits}
									{"  "}
									{getStr("totalCredits")}:{section.totalCredits}
									{"  "}
									{getStr("totalPoints")}:{gpaToStr(section.totalPoints, 1)}
								</Text>
							</View>
							{section.data.map((course, index) => (
								<View key={course.name}>
									{index > 0 && (
										<View
											style={{
												borderWidth: 0.4,
												marginHorizontal: 16,
												borderColor: colors.themeGrey,
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
											style={{
												fontSize: 16,
												flex: 2,
												color: colors.text,
												marginLeft: 8,
											}}>
											{course.name}
										</Text>
										<Text
											numberOfLines={1}
											style={{
												fontSize: 16,
												flex: 0,
												color: colors.fontB2,
											}}>
											{course.credit}
											{" cr · "}
											{gpaToStr(course.point, 1)}
										</Text>
									</View>
								</View>
							))}
						</RoundedView>
					))}
					{mode === "gather" && (
						<RoundedView style={{marginBottom: 16}}>
							{reportSorted.map((course, index) => (
								<View key={course.name + course.semester}>
									{index > 0 && (
										<View
											style={{
												borderWidth: 0.4,
												marginHorizontal: 16,
												borderColor: colors.themeGrey,
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
											style={{
												fontSize: 16,
												flex: 2,
												color: colors.text,
												marginLeft: 8,
											}}>
											[{course.semester}] {course.name}
										</Text>
										<Text
											numberOfLines={1}
											style={{
												fontSize: 16,
												flex: 0,
												color: colors.fontB2,
											}}>
											{course.credit}
											{" pts · "}
											{gpaToStr(course.point, 1)}
										</Text>
									</View>
								</View>
							))}
						</RoundedView>
					)}
				</View>
			</ScrollView>
		</View>
	);
};
