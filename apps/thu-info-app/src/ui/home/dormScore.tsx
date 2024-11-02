import {ActivityIndicator, View, useColorScheme} from "react-native";
import {useEffect, useState} from "react";
import {NetworkRetry} from "../../components/easySnackbars";
import {getStr} from "../../utils/i18n";
import ImageViewer from "react-native-image-zoom-viewer";
import {helper, State} from "../../redux/store";
import {saveRemoteImg} from "../../utils/saveImg";
import {DormAuthError} from "@thu-info/lib/src/utils/error";
import {RootNav} from "../../components/Root";
import {useSelector} from "react-redux";
import themes from "../../assets/themes/themes";

export const DormScoreScreen = ({navigation}: {navigation: RootNav}) => {
	const [base64, setBase64] = useState<string>();
	const dormPassword = useSelector((s: State) => s.credentials.dormPassword);
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
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
			<ImageViewer
				imageUrls={[{ url: `data:image/png;base64,${base64}` }]}
				backgroundColor={colors.themeBackground}
				onSave={saveRemoteImg}
				renderIndicator={() => <ActivityIndicator />}
				menuContext={{
					saveToLocal: getStr("saveImage"),
					cancel: getStr("cancel"),
				}}
			/>
		</View>
	);
};
