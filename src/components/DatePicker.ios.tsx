import {DatePickerIOS} from "react-native";
import React from "react";

// TODO: fix ios date picker
export const MyDatePicker = ({
	date,
	onChange,
	disabled,
}: {
	date: Date;
	onChange: any;
	disabled: boolean;
}) => <DatePickerIOS date={date} onDateChange={onChange} />;
