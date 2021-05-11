import React, {useState, useEffect} from "react";
import Snackbar from "react-native-snackbar";
import {getStr} from "src/utils/i18n";
import {WebView} from "react-native-webview";
import {View, ActivityIndicator} from "react-native";
import {NewsDetailRouteProp} from "./newsStack";
import themes from "../../assets/themes/themes";
import {USER_AGENT} from "thu-info-lib/dist/constants/strings";
import {useColorScheme} from "react-native";
import themedStyles from "../../utils/themedStyles";
import {helper} from "../../redux/store";

export const NewsDetailScreen = ({route}: {route: NewsDetailRouteProp}) => {
	const [html, setHtml] = useState<string>("");
	const [refreshing, setRefreshing] = useState(true);

	const themeName = useColorScheme();
	const theme = themes(themeName);
	const style = styles(themeName);

	const fetchHtml = () => {
		setRefreshing(true);
		helper
			.getNewsDetail(route.params.detail.url)
			.then(([title, res]) => {
				setHtml(`<h2>${title}</h2>${res}`);
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

	const adaptedHtml = `<head><meta name="viewport" content="width=100, initial-scale=1"></head>
	<body>${html}</body>`;

	return (
		<>
			<View style={style.container}>
				<WebView
					source={{html: adaptedHtml, baseUrl: route.params.detail.url}}
					containerStyle={style.webContainer}
					userAgent={USER_AGENT}
					setSupportMultipleWindows={false}
				/>
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
		backgroundColor: theme.colors.background,
		flex: 1,
		padding: 15,
		position: "absolute",
		top: 0,
		left: 0,
		bottom: 0,
		right: 0,
	},

	webContainer: {
		backgroundColor: theme.colors.background,
		color: theme.colors.text,
	},
}));
