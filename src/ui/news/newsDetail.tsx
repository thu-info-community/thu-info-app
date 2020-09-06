import React, {useState, useEffect, useContext} from "react";
import {getNewsDetail} from "src/network/news";
import Snackbar from "react-native-snackbar";
import {getStr} from "src/utils/i18n";
import {WebView} from "react-native-webview";
import {View, StyleSheet, ActivityIndicator} from "react-native";
import {NewsDetailRouteProp} from "./newsStack";
import {ThemeContext} from "../../assets/themes/context";
import themes from "../../assets/themes/themes";

export const NewsDetailScreen = ({route}: {route: NewsDetailRouteProp}) => {
	const [html, setHtml] = useState<string>("");
	const [refreshing, setRefreshing] = useState(true);

	const themeName = useContext(ThemeContext);
	const theme = themes[themeName];

	const fetchHtml = () => {
		setRefreshing(true);
		getNewsDetail(route.params.detail.url)
			.then(([title, res]) => {
				setHtml(`<h1>${title}</h1>${res}`);
				// console.log(res);
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

	return (
		<>
			<View style={styles.container}>
				<WebView
					source={{html: html, baseUrl: route.params.detail.url}}
					containerStyle={styles.webContainer}
					textZoom={240} // TODO: what about ios? what about images?
				/>
			</View>
			{refreshing && (
				<View style={styles.container}>
					<ActivityIndicator size="large" color={theme.colors.primary} />
				</View>
			)}
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 15,
		position: "absolute",
		top: 0,
		left: 0,
		bottom: 0,
		right: 0,
	},

	webContainer: {
		backgroundColor: "#f2f2f2",
	},
});
