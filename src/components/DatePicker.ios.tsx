import {DatePickerIOS} from "react-native";
import React from "react";

// TODO: fix ios date picker
export const MyDatePicker = ({date, onChange}: {date: Date; onChange: any}) => (
	<DatePickerIOS date={date} onDateChange={onChange} />
);
