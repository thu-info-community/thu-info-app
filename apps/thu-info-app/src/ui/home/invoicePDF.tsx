import {RootStackParamList} from "../../components/Root";
import Pdf from "react-native-pdf";
import {RouteProp} from "@react-navigation/native";
import {ViewerContainer} from "../../components/subpage/viewer";

export const InvoicePDFScreen = ({
	route: {
		params: {base64},
	},
}: {
	route: RouteProp<RootStackParamList, "InvoicePDF">;
}) => {
	return (
		<ViewerContainer>
			<Pdf
				style={{flex: 1}}
				source={{uri: `data:application/pdf;base64,${base64}`}}
			/>
		</ViewerContainer>
	);
};
