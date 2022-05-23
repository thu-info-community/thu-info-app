import {
	Modal,
	Text,
	TouchableOpacity,
	View,
	Button,
	Platform,
} from "react-native";
import React, {useState} from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import {getStr} from "src/utils/i18n";
import {useColorScheme} from "react-native";
import themes from "../assets/themes/themes";

// TODO: Adapt to fit the new date picker ui of iOS14
export const DatePickerTrigger = ({
	date,
	onChange,
	disabled,
	text,
}: {
	date: Date;
	onChange: (newDate: Date) => void;
	disabled: boolean;
	text: string;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const [visible, setVisible] = useState(false);

	return (
		<>
			<TouchableOpacity
				style={{
					flex: 1,
					padding: 6,
				}}
				onPress={() => setVisible(true)}
				disabled={disabled}>
				<Text
					style={{
						textAlign: "center",
						fontSize: 16,
						color: colors.text,
					}}>
					{date.format()}
				</Text>
			</TouchableOpacity>
			{visible && Platform.OS === "android" && (
				<DateTimePicker
					value={date}
					mode="date"
					onChange={(_, selectedDate) => {
						setVisible(false);
						if (selectedDate !== undefined) {
							onChange(selectedDate);
						}
					}}
				/>
			)}
			{visible && Platform.OS === "ios" && (
				<Modal
					animationType="slide"
					transparent={true}
					onRequestClose={() => {}}>
					<View
						style={{
							flex: 1,
							justifyContent: "flex-end",
							alignContent: "center",
						}}>
						<View
							style={{
								backgroundColor: colors.themeBackground,
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "space-around",
								shadowColor: "gray",
								shadowOffset: {
									width: 0,
									height: 1,
								},
								shadowRadius: 3,
								shadowOpacity: 0.8,
								paddingVertical: 4,
							}}>
							<Text style={{fontSize: 16, color: colors.text}}>{text}</Text>
							<Button
								title={getStr("confirm")}
								onPress={() => {
									setVisible(false);
								}}
							/>
						</View>
						<DateTimePicker
							value={date}
							mode="date"
							onChange={(_, selectedDate) => {
								if (selectedDate !== undefined) {
									onChange(selectedDate);
								}
							}}
							style={{
								width: "100%",
								backgroundColor: colors.themeBackground,
								alignSelf: "center",
							}}
						/>
					</View>
					<View style={{height: 15, backgroundColor: colors.themeBackground}} />
				</Modal>
			)}
		</>
	);
};
