import React from "react";
import {getReport} from "../../network/basics";

export const ReportScreen = () => {
	getReport().then((res) => console.log(res));
	return <></>;
};
