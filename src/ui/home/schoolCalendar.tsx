import {Image, Text, TextInput, useColorScheme, View} from "react-native";
import {helper} from "../../redux/store";
import {NetworkRetry} from "../../components/easySnackbars";
import {useState} from "react";
import themes from "../../assets/themes/themes";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import ModalDropdown from "react-native-modal-dropdown";

export const SchoolCalendar = () => {
	const thisYear = new Date().getFullYear();
	const [src, setSrc] = useState("");
	const [year, setYear] = useState(thisYear);
	const [yearText, setYearText] = useState(thisYear.toString());
	const [semester, setSemester] = useState("autumn" as "autumn" | "spring");
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
		<View style={{flex: 1}}>
			<View
				style={{
					flexDirection: "row",
					height: "20%",
				}}>
				<View
					style={{
						flex: 1,
						flexDirection: "row",
						width: "50%",
						alignItems: "center",
						justifyContent: "center",
					}}>
					<Text style={{color: colors.text}}>{getStr("calendarYear")}</Text>
					<TextInput
						keyboardType="numeric"
						style={{
							paddingHorizontal: 8,
							paddingVertical: 4,
							borderWidth: 1,
							borderRadius: 4,
							borderColor: "gray",
							color: colors.primary,
						}}
						onChangeText={setYearText}
						onSubmitEditing={() => {
							const y = parseInt(yearText, 10);
							if (y > 2000 && y <= thisYear) {
								setYear(y);
							} else {
								Snackbar.show({
									text: getStr("calendarYearOutOfRange"),
									duration: Snackbar.LENGTH_SHORT,
								});
							}
						}}
						defaultValue={thisYear.toString()}
					/>
				</View>
				<View
					style={{
						flex: 1,
						flexDirection: "row",
						width: "50%",
						alignItems: "center",
						justifyContent: "center",
					}}>
					<Text style={{color: colors.text}}>{getStr("calendarSemester")}</Text>
					<ModalDropdown
						options={semesterOptions}
						defaultIndex={0}
						defaultValue={getStr("autumn")}
						style={{
							padding: 8,
							borderWidth: 1,
							borderRadius: 4,
							borderColor: "gray",
							minWidth: 80,
						}}
						textStyle={{
							fontSize: 14,
							color: colors.text,
						}}
						dropdownStyle={{
							paddingHorizontal: 10,
							borderRadius: 4,
						}}
						showsVerticalScrollIndicator={false}
						adjustFrame={(val) => {
							return {
								...val,
								height: 2 * 35 + 5,
							};
						}}
						onSelect={(index, _) => {
							setSemester(index === "0" ? "autumn" : "spring");
						}}
					/>
				</View>
			</View>

			<View style={{height: "80%"}}>
				{src !== "" && (
					<Image
						source={{uri: src}}
						style={{width: "100%", height: "100%"}}
						resizeMode="contain"
					/>
				)}
			</View>
		</View>
	);
};
