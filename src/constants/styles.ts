import {StyleSheet} from "react-native";

export const Material = StyleSheet.create({
	card: {
		margin: 10,
		padding: 10,
		backgroundColor: "white",
		shadowColor: "grey",
		shadowOffset: {
			width: 2,
			height: 2,
		},
		shadowOpacity: 0.8,
		shadowRadius: 2,
		borderRadius: 5,
		elevation: 2,
	},
});
