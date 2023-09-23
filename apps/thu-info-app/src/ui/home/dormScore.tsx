import {View} from "react-native";
import {useEffect, useState} from "react";
import {NetworkRetry} from "../../components/easySnackbars";
import {getStr} from "../../utils/i18n";
import ImageViewer from "react-native-image-zoom-viewer";
import {helper, State} from "../../redux/store";
import {saveRemoteImg} from "../../utils/saveImg";
import {DormAuthError} from "thu-info-lib/dist/utils/error";
import {RootNav} from "../../components/Root";
import {useSelector} from "react-redux";

export const DormScoreScreen = ({navigation}: {navigation: RootNav}) => {
	const [base64, setBase64] = useState<string>();
	const dormPassword = useSelector((s: State) => s.credentials.dormPassword);
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
					imageUrls={[{url: `data:image/png;base64,${base64}`}]}
					onSave={saveRemoteImg}
					renderIndicator={() => <View />}
					menuContext={{
						saveToLocal: getStr("saveImage"),
						cancel: getStr("cancel"),
					}}
				/>
			)}
		</View>
	);
};
