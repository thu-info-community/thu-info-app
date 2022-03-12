import React, {useEffect, useState} from "react";
import {HomeNav, ReservesLibPDFProp} from "./homeStack";
import {Dimensions, StyleSheet, View} from "react-native";
import Pdf from "react-native-pdf";
import {helper} from "../../redux/store";

export const ReservesLibPDFScreen = ({
	route: {
		params: {book},
	},
}: {
	navigation: HomeNav;
	route: ReservesLibPDFProp;
}) => {
	const [content, setContent] = useState<string>();

	useEffect(() => {
		helper.getReservesLibBookDetail(book.bookId).then((r) => {
			if (r) {
				helper.reservesLibDownloadChapters(r.chapters).then((pdf) => {
					setContent(
						pdf.output("datauristring").replace("filename=generated.pdf;", ""),
					);
				});
			}
		});
	}, [book.bookId]);

	return (
		<View style={styles.container}>
			{content !== undefined && (
				<Pdf style={styles.pdf} source={{uri: content}} />
			)}
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
