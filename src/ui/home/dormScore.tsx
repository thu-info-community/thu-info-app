import {View} from "react-native";
import React, {useEffect, useState} from "react";
import {getDormScore} from "../../network/dorm";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import ImageViewer from "react-native-image-zoom-viewer";

export const DormScoreScreen = () => {
	const [url, setUrl] = useState<string>();
	useEffect(() => {
		getDormScore()
			.then(setUrl)
			.catch(() =>
				Snackbar.show({
					text: getStr("homeNetworkRetry"),
					duration: Snackbar.LENGTH_LONG,
				}),
			);
	}, []);
	return (
		<View style={{flex: 1}}>{url && <ImageViewer imageUrls={[{url}]} />}</View>
	);
};
