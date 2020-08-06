import React, {useState, useEffect} from "react";
import {getNewsDetail} from "src/network/news";
import Snackbar from "react-native-snackbar";
import {getStr} from "src/utils/i18n";
import {WebView} from "react-native-webview";

export const NewsDetailScreen = ({route}: any) => {
	const [html, setHtml] = useState<string>("");
	const [refreshing, setRefreshing] = useState(true);

	const fetchHtml = () => {
		setRefreshing(true);
		getNewsDetail(route.params.url)
			.then((res) => {
				setHtml(res);
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

	useEffect(fetchHtml, []);

	console.log(html);

	return <WebView source={{html: html}} />;
};
