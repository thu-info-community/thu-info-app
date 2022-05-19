import {View} from "react-native";
import React, {useEffect, useState} from "react";
import {NetworkRetry} from "../../components/easySnackbars";
import {getStr} from "../../utils/i18n";
import ImageViewer from "react-native-image-zoom-viewer";
import {helper} from "../../redux/store";
import {saveRemoteImg} from "../../utils/saveImg";
import {DormAuthError} from "thu-info-lib/dist/utils/error";
import {RootNav} from "../../components/Root";

export const DormScoreScreen = ({navigation}: {navigation: RootNav}) => {
	const [url, setUrl] = useState<string>();
	useEffect(() => {
		helper
			.getDormScore()
			.then(setUrl)
			.catch((e) => {
				if (e instanceof DormAuthError) {
					navigation.navigate("MyhomeLogin");
				} else {
					NetworkRetry();
				}
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
