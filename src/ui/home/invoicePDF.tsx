import {RootStackParamList} from "../../components/Root";
import {Dimensions, useColorScheme, View} from "react-native";
import Pdf from "react-native-pdf";
import {RouteProp} from "@react-navigation/native";
import themedStyles from "../../utils/themedStyles";

export const InvoicePDFScreen = ({
	route: {
		params: {base64},
	},
}: {
	route: RouteProp<RootStackParamList, "InvoicePDF">;
}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	return (
		<View style={style.container}>
			<Pdf
				style={style.pdf}
				source={{uri: `data:application/pdf;base64,${base64}`}}
			/>
		</View>
	);
};

const styles = themedStyles((theme) => ({
	container: {
		flex: 1,
		justifyContent: "flex-start",
		alignItems: "center",
		marginTop: 25,
	},
	pdf: {
		flex: 1,
		backgroundColor: theme.colors.themeBackground,
		width: Dimensions.get("window").width,
		height: Dimensions.get("window").height,
	},
}));
