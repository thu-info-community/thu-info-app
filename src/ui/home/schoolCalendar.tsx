import {Text, useColorScheme, View} from "react-native";
import {helper, State} from "../../redux/store";
import {NetworkRetry} from "../../components/easySnackbars";
import {useState} from "react";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import {BottomPopupTriggerView, RoundedView} from "../../components/views";
import IconRight from "../../assets/icons/IconRight";
import ScrollPicker from "react-native-wheel-scrollview-picker";
import Snackbar from "react-native-snackbar";
import ImageViewer from "react-native-image-zoom-viewer";
import {saveRemoteImg} from "../../utils/saveImg";
import {useSelector} from "react-redux";

export const SchoolCalendar = () => {
	const firstYear = 2019;

	const semesterDescription = useSelector(
		(s: State) => s.config.semesterId,
	).split("-");

	const currentYear = parseInt(semesterDescription[0], 10);
	const [semester, setSemester] = useState(
		(semesterDescription[2] === "1" || semesterDescription[2] === "W"
			? "autumn"
			: "spring") as "autumn" | "spring",
	);

	const [src, setSrc] = useState("");
	const [year, setYear] = useState(currentYear);
	const [yearSelection, setYearSelection] = useState(currentYear);
	const [semesterSelection, setSemesterSelection] = useState(
		semester === "autumn" ? 0 : 1,
	);
	const semesterOptions = [getStr("autumn"), getStr("spring")];
	const appLang = getStr("mark") === "CH" ? "zh" : "en";
	const [lang, setLang] = useState(appLang as "zh" | "en");
	const [error, setError] = useState(false);

	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	if (!error) {
		helper.getCalendarImageUrl(year, semester, lang).then((r) => {
			setSrc(r);
		});
	}

	return (
		<View style={{flex: 1, padding: 16}}>
			<RoundedView style={{marginVertical: 16, flex: 1}}>
				{src !== "" && !error && (
					<ImageViewer
						imageUrls={[
							{
								url: src,
								props: {
									//@ts-ignore once TS7006, onError is a valid, used prop "Image.onError" and e is error event
									onError: (e) => {
										setError(true);
										const errStr = e.nativeEvent?.error;
										if (errStr && errStr.search("code=404") !== -1) {
											if (lang === appLang) {
												Snackbar.show({
													text: getStr("calendarNoCurrentLang"),
													duration: Snackbar.LENGTH_SHORT,
												});

												// Try the other language
												setLang(appLang === "zh" ? "en" : "zh");
												setError(false);
											} else {
												Snackbar.show({
													text: getStr("calendarNotFound"),
													duration: Snackbar.LENGTH_SHORT,
												});
											}
										} else {
											NetworkRetry();
										}
									},
								},
							},
						]}
						style={{marginHorizontal: 10, borderRadius: 8}}
						backgroundColor={colors.contentBackground}
						onSave={saveRemoteImg}
						menuContext={{
							saveToLocal: getStr("saveImage"),
							cancel: getStr("cancel"),
						}}
						renderIndicator={() => <View />}
					/>
				)}
			</RoundedView>

			<RoundedView style={{padding: 16, marginVertical: 16}}>
				<BottomPopupTriggerView
					popupTitle={getStr("selectSemester")}
					popupContent={
						<View style={{flexDirection: "row"}}>
							<ScrollPicker
								dataSource={Array.from(
									new Array(currentYear - firstYear + 1),
									(_, k) => k + firstYear,
								)}
								selectedIndex={year - firstYear}
								renderItem={(data) => (
									<Text style={{color: colors.fontB1, fontSize: 20}} key={data}>
										{data}
									</Text>
								)}
								onValueChange={(_, index) => {
									setYearSelection(index + firstYear);
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
						setError(false);
						setLang(appLang);
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
