import React, {useEffect, useState} from "react";
import {HomeNav, ReservesLibPDFProp} from "./homeStack";
import {Dimensions, StyleSheet, Text, View} from "react-native";
import Pdf from "react-native-pdf";
import {helper} from "../../redux/store";
import RNFS from "react-native-fs";

export const ReservesLibPDFScreen = ({
	route: {
		params: {book},
	},
}: {
	navigation: HomeNav;
	route: ReservesLibPDFProp;
}) => {
	const [content, setContent] = useState<string>();
	const [total, setTotal] = useState(0);
	const [done, setDone] = useState(0);
	const [downloading, setDownloading] = useState(true);

	useEffect(() => {
		helper.getReservesLibBookDetail(book.bookId).then((r) => {
			if (r) {
				helper
					.reservesLibDownloadChapters(r.chapters, (t, c) => {
						setTotal(t);
						setDone(c);
					})
					.then((pdf) => {
						setDownloading(false);
						const base64 = pdf
							.output("datauristring")
							.replace("filename=generated.pdf;", "");
						setContent(base64);
						const filename = `[${book.bookId}] ${book.title} - ${book.author}.pdf`;
						const path = RNFS.DownloadDirectoryPath + "/" + filename;
						const saveData = base64.substring(base64.indexOf("base64,") + 7);
						return RNFS.writeFile(path, saveData, "base64");
					});
			}
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [book.bookId]);

	return (
		<View style={styles.container}>
			{content === undefined && (
				<Text>
					{downloading ? "下载中，请勿离开本页面！" : "转码中"}({done}/{total})
				</Text>
			)}
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
