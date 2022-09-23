import {Platform, View} from "react-native";
import React, {useEffect, useState} from "react";
import {NetworkRetry} from "../../components/easySnackbars";
import {getStr} from "../../utils/i18n";
import ImageViewer from "react-native-image-zoom-viewer";
import {helper, State} from "../../redux/store";
import {saveRemoteImg} from "../../utils/saveImg";
import {DormAuthError} from "thu-info-lib/dist/utils/error";
import {RootNav} from "../../components/Root";
import {connect} from "react-redux";

const DormScoreUI = ({
	navigation,
	dormPassword,
}: {
	navigation: RootNav;
	dormPassword: string;
}) => {
	const [base64, setBase64] = useState<string>();
	useEffect(() => {
		helper
			.getDormScore(dormPassword)
			.then(setBase64)
			.catch((e) => {
				if (e instanceof DormAuthError) {
					navigation.navigate("MyhomeLogin");
				} else {
					NetworkRetry();
				}
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dormPassword]);
	return (
		<View style={{flex: 1}}>
			{base64 && (
				<ImageViewer
					imageUrls={[{url: `data:image/png;base64,${Platform.OS === "ios" ? "/9j/4AAQSkZJRg" : ""}${base64}`}]}
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

export const DormScoreScreen = connect((state: State) => ({
	...state.credentials,
}))(DormScoreUI);
