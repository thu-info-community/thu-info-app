import React, {useState, useEffect} from "react";
import Snackbar from "react-native-snackbar";
import {getStr} from "src/utils/i18n";
import {WebView} from "react-native-webview";
import {View, ActivityIndicator, Dimensions} from "react-native";
import {NewsDetailRouteProp} from "../../components/Root";
import themes from "../../assets/themes/themes";
import {USER_AGENT} from "thu-info-lib/dist/constants/strings";
import {useColorScheme} from "react-native";
import themedStyles from "../../utils/themedStyles";
import {helper} from "../../redux/store";
import Pdf from "react-native-pdf";

export const NewsDetailScreen = ({route}: {route: NewsDetailRouteProp}) => {
	const [html, setHtml] = useState<string>("");
	const [pdf, setPdf] = useState<string>("");
	const [refreshing, setRefreshing] = useState(true);

	const themeName = useColorScheme();
	const theme = themes(themeName);
	const style = styles(themeName);

	const fetchHtml = () => {
		setRefreshing(true);
		helper
			.getNewsDetail(route.params.detail.url)
			.then(([title, res, abstract]) => {
				if (title === "PdF" && abstract === "PdF") {
					setPdf(res);
				} else {
					setHtml(`<h2>${title}</h2>${res}`);
				}
				setRefreshing(false);
			})
			.catch(() => {
				Snackbar.show({
					text: getStr("networkRetry"),
					duration: Snackbar.LENGTH_LONG,
				});
				setRefreshing(false);
			});
	};

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(fetchHtml, []);

	const adaptedHtml = `<head>
		<meta name="viewport" content="width=100, initial-scale=1">
		<style>
			* {
				background-color: ${theme.colors.themeBackground} !important;
				color: ${theme.colors.text} !important;
			}
			
			h1,h2,h3,h4,h5,h6 {
				color: ${theme.colors.primary} !important;
				text-align: center;
			}
			
			a {
				color: ${theme.colors.themePurple} !important;
			}
		</style>
	</head>
	<body>${html}</body>`;

	return (
		<>
			<View style={style.container}>
				{pdf === "" ? (
					<WebView
						source={{
							html: adaptedHtml,
							baseUrl: "https://webvpn.tsinghua.edu.cn",
						}}
						containerStyle={style.webContainer}
						userAgent={USER_AGENT}
						setSupportMultipleWindows={false}
						forceDarkOn={themeName === "dark"}
						style={`* { background-color: ${theme.colors.themeBackground}}`}
					/>
				) : (
					<Pdf
						style={style.pdf}
						source={{uri: `data:application/pdf;base64,${pdf}`}}
					/>
				)}
			</View>
			{refreshing && (
				<View style={style.container}>
					<ActivityIndicator size="large" color={theme.colors.primary} />
				</View>
			)}
		</>
	);
};

const styles = themedStyles((theme) => ({
	container: {
		backgroundColor: theme.colors.themeBackground,
		flex: 1,
		padding: 15,
		position: "absolute",
		top: 0,
		left: 0,
		bottom: 0,
		right: 0,
	},

	webContainer: {
		backgroundColor: theme.colors.themeBackground,
		color: theme.colors.text,
	},

	pdf: {
		flex: 1,
		width: Dimensions.get("window").width,
		height: Dimensions.get("window").height,
	},
}));
