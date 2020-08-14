import {Text} from "react-native";
import React from "react";
import {getClassroomState} from "../../network/basics";
import {ClassroomDetailRouteProp} from "./homeStack";

export const ClassroomDetailScreen = ({
	route,
}: {
	route: ClassroomDetailRouteProp;
}) => {
	const name = route.params.name;
	getClassroomState(name, 8).then((res) => console.log(res));
	return <Text>{route.params.name}</Text>;
};
