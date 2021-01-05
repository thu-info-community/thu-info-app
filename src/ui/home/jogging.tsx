import {Text} from "react-native";
import React, {useEffect, useState} from "react";
import {helper} from "../../redux/store";
import {JoggingRecord} from "thu-info-lib/lib/models/home/jogging";

export const JoggingScreen = () => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [result, setResult] = useState<JoggingRecord[]>([]);
	useEffect(() => {
		helper.getJoggingRecord().then(setResult);
	}, []);
	return <Text>23333</Text>;
};
