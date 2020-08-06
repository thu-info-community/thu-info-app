import React from "react";
import {Text} from "react-native";
import {connect} from "react-redux";
import {State} from "../../redux/store";
import {HOLE_SET_TOKEN} from "../../redux/constants";

interface HoleProps {
	token: string;
	setToken: (token: string) => void;
}

const HoleUI = (props: HoleProps) => {
	console.log(props.token);
	// props.setToken("2333");
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
