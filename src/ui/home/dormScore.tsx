import {View, Text, ScrollView} from "react-native";
import React, {useEffect, useState} from "react";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import ImageViewer from "react-native-image-zoom-viewer";
import {helper} from "../../redux/store";
import {retryWrapper} from "thu-info-lib/lib/lib/core";
import {retrieve} from "thu-info-lib/lib/utils/network";
import {
	DORM_SCORE_REFERER,
	DORM_SCORE_URL,
} from "thu-info-lib/lib/constants/strings";
import cheerio from "cheerio";

export const DormScoreScreen = () => {
	const [url, setUrl] = useState<string>();
	const [debug, setDebug] = useState<string>();

	useEffect(() => {
		retryWrapper(
			helper,
			-1,
			retrieve(DORM_SCORE_URL, DORM_SCORE_REFERER).then((s) => {
				try {
					setDebug(
						`[Debug] Element HTML: ${cheerio(
							"#weixin_health_linechartCtrl1_Chart1",
							s,
						)}}
src: ${cheerio("#weixin_health_linechartCtrl1_Chart1", s).attr().src}`,
					);
				} catch (e) {
					setDebug(
						`[Debug] Element HTML: ${cheerio(
							"#weixin_health_linechartCtrl1_Chart1",
							s,
						)}}
Err: ${e}`,
					);
				}
				return (
					"https://webvpn.tsinghua.edu.cn" +
					cheerio("#weixin_health_linechartCtrl1_Chart1", s).attr().src
				);
			}),
		)
			.then(setUrl)
			.catch(() =>
				Snackbar.show({
					text: getStr("homeNetworkRetry"),
					duration: Snackbar.LENGTH_LONG,
				}),
			);
	}, []);
	return (
		<View style={{flex: 1}}>
			{url && <ImageViewer imageUrls={[{url}]} style={{flex: 1}} />}
			<ScrollView style={{flex: 1}}>
				<Text>{debug}</Text>
			</ScrollView>
		</View>
	);
};
