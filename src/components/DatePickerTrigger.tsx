import {Text, TouchableOpacity} from "react-native";
import React, {useState} from "react";
import DateTimePicker from "@react-native-community/datetimepicker";

export const DatePickerTrigger = ({
	date,
	onChange,
	disabled,
}: {
	date: Date;
	onChange: (date: Date) => void;
	disabled: boolean;
}) => {
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
					}}>
					{date.format()}
				</Text>
			</TouchableOpacity>
			{visible && (
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
		</>
	);
};
