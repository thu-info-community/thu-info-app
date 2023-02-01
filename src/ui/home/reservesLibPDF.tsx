import {useEffect, useState} from "react";
import {RootNav, ReservesLibPDFProp} from "../../components/Root";
import {
	Alert,
	Dimensions,
	Platform,
	StyleSheet,
	Text,
	useColorScheme,
	View,
} from "react-native";
import Pdf from "react-native-pdf";
import {helper} from "../../redux/store";
import ReactNativeBlobUtil from "react-native-blob-util";
import Snackbar from "react-native-snackbar";
import themes from "../../assets/themes/themes";

export const ReservesLibPDFScreen = ({
	route: {
		params: {book},
	},
}: {
	navigation: RootNav;
	route: ReservesLibPDFProp;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

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
					.then(async (pdf) => {
						setDownloading(false);
						const data = new Uint8Array(pdf.output("arraybuffer"));
						const filename =
							`[${book.bookId}]${book.title}-${book.author}.pdf`.replace(
								":",
								"_",
							);
						const path =
							(Platform.OS === "ios"
								? ReactNativeBlobUtil.fs.dirs.DocumentDir
								: ReactNativeBlobUtil.fs.dirs.DownloadDir) +
							"/" +
							filename;
						const stream = await ReactNativeBlobUtil.fs.writeStream(
							path,
							"ascii",
						);
						Alert.alert(
							"低性能",
							"转码部分目前的实现方式性能较低，需要等候较长时间。",
						);
						const chunkSize = 100000;
						for (let i = 0; i < data.byteLength; i += chunkSize) {
							// @ts-ignore
							await stream.write(Array.from(data.subarray(i, i + chunkSize)));
							setTotal(Math.ceil(data.byteLength / chunkSize));
							setDone(Math.floor(i / chunkSize));
						}
						return path;
					})
					.then((path) => {
						setContent(`file://${path}`);
					})
					.catch(() => {
						Snackbar.show({
							text: "保存失败",
							duration: Snackbar.LENGTH_SHORT,
						});
					});
			}
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [book.bookId]);

	return (
		<View style={styles.container}>
			{content === undefined && (
				<Text style={{color: colors.text}}>
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
