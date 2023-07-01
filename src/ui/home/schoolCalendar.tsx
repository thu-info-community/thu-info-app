import {Image, Text, useColorScheme, View} from "react-native";
import {helper} from "../../redux/store";
import {NetworkRetry} from "../../components/easySnackbars";
import {useState} from "react";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import {BottomPopupTriggerView, RoundedView} from "../../components/views";
import IconRight from "../../assets/icons/IconRight";
import ScrollPicker from "react-native-wheel-scrollview-picker";

export const SchoolCalendar = () => {
	const thisYear = new Date().getFullYear();
	const [src, setSrc] = useState("");
	const [year, setYear] = useState(thisYear);
	const [yearSelection, setYearSelection] = useState(thisYear);
	const [semester, setSemester] = useState("autumn" as "autumn" | "spring");
	const [semesterSelection, setSemesterSelection] = useState(0);
	const semesterOptions = [getStr("autumn"), getStr("spring")];
	const lang = getStr("mark") === "CH" ? "zh" : "en";

	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	helper
		.getCalendarImageUrl(year, semester, lang)
		.then((r) => {
			setSrc(r);
		})
		.catch(NetworkRetry);

	return (
		<View style={{flex: 1, padding: 16, justifyContent: "space-between"}}>
			<RoundedView style={{padding: 8, marginTop: 32, height: "60%"}}>
				{src !== "" && (
					<Image
						source={{uri: src}}
						style={{width: "100%", height: "100%", borderRadius: 8}}
						resizeMode="contain"
					/>
				)}
			</RoundedView>

			<RoundedView style={{padding: 8, marginBottom: 32}}>
				<BottomPopupTriggerView
					popupTitle={getStr("selectSemester")}
					popupContent={
						<View style={{flexDirection: "row"}}>
							<ScrollPicker
								dataSource={Array.from(
									new Array(thisYear - 2000 + 1),
									(_, k) => k + 2000,
								)}
								selectedIndex={year - 2000}
								renderItem={(data) => (
									<Text style={{color: colors.fontB1, fontSize: 20}} key={data}>
										{data}
									</Text>
								)}
								onValueChange={(_, index) => {
									setYearSelection(index + 2000);
								}}
								wrapperHeight={200}
								wrapperColor={colors.contentBackground}
								itemHeight={48}
								highlightColor={colors.themeGrey}
								highlightBorderWidth={1}
							/>
							<ScrollPicker
								dataSource={semesterOptions}
								selectedIndex={semesterSelection}
								renderItem={(_, index) => (
									<Text
										style={{color: colors.fontB1, fontSize: 20}}
										key={index}>
										{semesterOptions[index]}
									</Text>
								)}
								onValueChange={(_, index) => {
									setSemesterSelection(index);
								}}
								wrapperHeight={200}
								wrapperColor={colors.contentBackground}
								itemHeight={48}
								highlightColor={colors.themeGrey}
								highlightBorderWidth={1}
							/>
						</View>
					}
					popupCanFulfill={true}
					popupOnFulfilled={() => {
						setYear(yearSelection);
						setSemester(semesterSelection === 0 ? "autumn" : "spring");
					}}
					popupOnCancelled={() => {}}>
					<View style={{flexDirection: "row", alignItems: "center"}}>
						<Text style={{color: colors.fontB1, fontSize: 16, flex: 0}}>
							{getStr("selectSemester")}
						</Text>
						<View style={{flex: 1}} />
						<Text
							style={{color: colors.fontB3, fontSize: 16, flex: 0}}
							numberOfLines={1}>
							{year} {getStr(semester)}
						</Text>
						<IconRight height={24} width={24} />
					</View>
				</BottomPopupTriggerView>
			</RoundedView>
		</View>
	);
};
