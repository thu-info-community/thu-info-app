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
import Icon from "react-native-vector-icons/FontAwesome";

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
		DropdownContainer.current?.measure((_fx, _fy, _w, h, _px, py) => {
			const newValue = py + h;
			if (!isNaN(newValue)) {
				setDropdownTop(py + h);
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
					<Icon
						name="caret-down"
						size={12}
						color={open === "flag" ? colors.primary : colors.fontB2}
						style={{marginLeft: 8}}
					/>
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
					<Icon
						name="caret-down"
						size={12}
						color={open === "bx" ? colors.primary : colors.fontB2}
						style={{marginLeft: 8}}
					/>
				</TouchableOpacity>
				<View style={{flex: 1}} />
				<TouchableOpacity
					onPress={() => setMode((m) => (m === "split" ? "gather" : "split"))}
					style={{marginRight: 36, alignItems: "center", flex: 0}}>
					<Icon name="exchange" size={12} color={colors.fontB2} />
				</TouchableOpacity>
				<Modal visible={open !== undefined} transparent>
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
											{showTick ? (
												<Icon name="check" size={14} color={colors.primary} />
											) : null}
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
												height: 0.5,
												marginHorizontal: 16,
												backgroundColor: colors.fontB3,
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
											style={{fontSize: 16, flex: 2, color: colors.text}}>
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
											{" pts · "}
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
								<View key={course.name}>
									{index > 0 && (
										<View
											style={{
												height: 0.5,
												marginHorizontal: 16,
												backgroundColor: colors.fontB3,
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
											style={{fontSize: 16, flex: 2, color: colors.text}}>
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
