import React from "react";
import {useColorScheme, View} from "react-native";
import themes from "../../assets/themes/themes";

export const CourseTimeQuickGlance = ({
	time,
	width,
	height,
}: {
	time: string;
	width: number;
	height: number;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const segments =
		time.match(/\d-\d/g)?.map((s) => ({
			dayOfWeek: Number(s[0]),
			section: Number(s[2]),
		})) ?? [];
	const widthPerDay = width / 7;
	const heightPerSection = height / 6;
	return (
		<View style={{width, height, borderColor: "lightgrey", borderWidth: 1}}>
			{segments.map(({dayOfWeek, section}) => (
				<View
					style={{
						position: "absolute",
						top: heightPerSection * (section - 1),
						bottom: heightPerSection * (6 - section),
						left: widthPerDay * (dayOfWeek - 1),
						right: widthPerDay * (7 - dayOfWeek),
						backgroundColor: colors.accent,
					}}
				/>
			))}
			<View
				style={{
					position: "absolute",
					top: 0,
					bottom: 0,
					left: widthPerDay * 5,
					width: 1,
					backgroundColor: "lightgrey",
				}}
			/>
		</View>
	);
};
