import {View, useColorScheme} from "react-native";
import {useEffect, useState} from "react";
import {NetworkRetry} from "../../components/easySnackbars";
import ImageViewer from "react-native-image-zoom-viewer";
import {helper, State} from "../../redux/store";
import {useSelector} from "react-redux";
import themes from "../../assets/themes/themes";

export const DormScoreScreen = () => {
	const [base64, setBase64] = useState<string>();
	const dormPassword = useSelector((s: State) => s.credentials.dormPassword);
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	useEffect(() => {
		helper
			.getDormScore(dormPassword)
			.then(setBase64)
			.catch(NetworkRetry);
	}, [dormPassword]);
	return (
		<View style={{flex: 1}}>
			{base64 && (
				<ImageViewer
					imageUrls={[{ url: `data:image/png;base64,${base64}` }]}
					backgroundColor={colors.themeBackground}
					saveToLocalByLongPress={false}
					renderIndicator={() => <View />}
				/>
			)}
		</View>
	);
};
