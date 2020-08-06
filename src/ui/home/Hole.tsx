import React from "react";
import {Text} from "react-native";
import {connect} from "react-redux";
import {State} from "../../redux/store";
import {HOLE_SET_TOKEN} from "../../redux/constants";
import {holeLogin} from "../../network/hole";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface HoleProps {
	token: string;
	setToken: (token: string) => void;
}

const HoleUI = () => {
	holeLogin()
		.then(() => console.log("Succeed!"))
		.catch((r) => console.error(r));
	return <Text>2333</Text>;
};

export const HoleScreen = connect(
	(state: State) => state.hole,
	(dispatch) => {
		return {
			setToken: (token: string) =>
				dispatch({type: HOLE_SET_TOKEN, payload: token}),
		};
	},
)(HoleUI);
