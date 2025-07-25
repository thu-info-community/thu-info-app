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
	const segments = Array.from(
		time.matchAll(/(\d)-(\d)\([^)]*\)/g),
		([, d1, d2]) => ({
			dayOfWeek: Number(d1),
			section: Number(d2),
		})
	);
	const widthPerDay = width / 7;
	const heightPerSection = height / 6;
	return (
		<View style={{width, height, borderColor: "lightgrey", borderWidth: 1}}>
			{segments.map(({dayOfWeek, section}) => (
				<View
					key={`${dayOfWeek}-${section}`}
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
