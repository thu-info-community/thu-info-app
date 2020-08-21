import {Text} from "react-native";
import React, {useEffect, useState} from "react";
import {JoggingRecord} from "../../models/home/jogging";
import {getJoggingRecord} from "../../network/basics";

export const JoggingScreen = () => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [result, setResult] = useState<JoggingRecord[]>([]);
	useEffect(() => {
		getJoggingRecord().then(setResult);
	}, []);
	return <Text>23333</Text>;
};
