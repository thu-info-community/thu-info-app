import React from "react";
import {RootStackParamList} from "../../components/Root";
import {Dimensions, StyleSheet, View} from "react-native";
import Pdf from "react-native-pdf";
import {RouteProp} from "@react-navigation/native";

export const InvoicePDFScreen = ({
	route: {
		params: {base64},
	},
}: {
	route: RouteProp<RootStackParamList, "InvoicePDF">;
}) => {
	return (
		<View style={styles.container}>
			<Pdf
				style={styles.pdf}
				source={{uri: `data:application/pdf;base64,${base64}`}}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "flex-start",
		alignItems: "center",
		marginTop: 25,
	},
	pdf: {
		flex: 1,
		width: Dimensions.get("window").width,
		height: Dimensions.get("window").height,
	},
});
