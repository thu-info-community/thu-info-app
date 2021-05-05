import {View} from "react-native";
import React, {useEffect, useState} from "react";
import Snackbar from "react-native-snackbar";
import {getStr} from "../../utils/i18n";
import ImageViewer from "react-native-image-zoom-viewer";
import {helper} from "../../redux/store";
import {saveRemoteImg} from "../../utils/saveImg";

export const DormScoreScreen = () => {
	const [url, setUrl] = useState<string>();
	useEffect(() => {
		helper
			.getDormScore()
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
			{url && (
				<ImageViewer
					imageUrls={[{url}]}
					onSave={saveRemoteImg}
					menuContext={{
						saveToLocal: getStr("saveImage"),
						cancel: getStr("cancel"),
					}}
				/>
			)}
		</View>
	);
};
