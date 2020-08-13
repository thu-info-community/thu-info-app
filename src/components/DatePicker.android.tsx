import {DatePickerAndroid, Text, TouchableOpacity} from "react-native";
import React from "react";
import "../../src/utils/extensions";

export const MyDatePicker = ({
	date,
	onChange,
	disabled,
}: {
	date: Date;
	onChange: any;
	disabled: boolean;
}) => (
	<TouchableOpacity
		style={{
			flex: 1,
			padding: 6,
		}}
		onPress={async () => {
			try {
				// @ts-ignore
				const {action, year, month, day} = await DatePickerAndroid.open({date});
				if (action !== DatePickerAndroid.dismissedAction) {
					onChange(new Date(year, month, day));
				}
			} catch ({code, message}) {
				console.warn("Cannot open date picker", message);
			}
		}}
		disabled={disabled}>
		<Text
			style={{
				textAlign: "center",
				fontSize: 16,
			}}>
			{date.format()}
		</Text>
	</TouchableOpacity>
);
