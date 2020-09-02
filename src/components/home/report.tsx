import {StyleSheet, Text, View} from "react-native";
import React from "react";
import {currState} from "../../redux/store";

const gpaToStr = (gpa: number, dig: number) =>
	isNaN(gpa) ? "N/A" : gpa.toFixed(dig);

export interface ReportHeaderProps {
	semester: string;
	gpa: number;
}

export const ReportHeader = (props: ReportHeaderProps) => (
	<View style={{...styles.reportContainer, margin: 10}}>
		<Text numberOfLines={1} style={{fontSize: 18, flex: 1}}>
			{props.semester}
		</Text>
		<Text numberOfLines={1} style={{fontSize: 18, flex: 0}}>
			{gpaToStr(props.gpa, 3)}
		</Text>
	</View>
);

interface ReportItemProps {
	name: string;
	credit: number;
	grade: string;
	point: number;
}

const gradeToColor: {[key: string]: string} = {
	"A+": "#456A2C",
	A: "#456A2C",
	"A-": "#456A2C",
	"B+": "#6AA343",
	B: "#A7B620",
	"B-": "#BEC705",
	"C+": "#C5A904",
	C: "#BC820E",
	"C-": "#B66216",
	"D+": "#A15713",
	D: "#74350A",
	P: "#009242",
	F: "#AC0000",
};

export const ReportItem = (props: ReportItemProps) => (
	<View style={styles.reportContainer}>
		<View
			style={{
				marginLeft: 4,
				marginRight: 8,
				alignItems: "center",
				justifyContent: "center",
				width: 27,
				height: 27,
				backgroundColor:
					props.grade === "A-" && !currState().config.newGPA
						? "#5E943D"
						: props.grade in gradeToColor
						? gradeToColor[props.grade]
						: "#A6A6A6",
				borderStyle: "solid",
				borderRadius: 14,
				paddingBottom: 2,
			}}>
			<Text style={{fontSize: 12, textAlign: "center", color: "#fff"}}>
				{props.grade}
			</Text>
		</View>
		<Text numberOfLines={1} style={{fontSize: 16, flex: 2}}>
			{props.name}
		</Text>
		<Text
			numberOfLines={1}
			style={{fontSize: 16, flex: 0.2, textAlign: "right"}}>
			{props.credit}
		</Text>
		<Text numberOfLines={1} style={{fontSize: 16, flex: 0}}>
			{" · "}
		</Text>
		<Text
			numberOfLines={1}
			style={{fontSize: 16, flex: 0.3, textAlign: "left"}}>
			{gpaToStr(props.point, 1)}
		</Text>
	</View>
);

export const ReportFooter = (props: {gpa: number}) => (
	<View style={{...styles.reportContainer, justifyContent: "flex-end"}}>
		<Text style={{fontSize: 20, textAlign: "right"}}>
			{gpaToStr(props.gpa, 3)}
		</Text>
	</View>
);

const styles = StyleSheet.create({
	reportContainer: {
		margin: 6,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
});
