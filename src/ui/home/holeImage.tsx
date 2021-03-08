import {View} from "react-native";
import React from "react";
import ImageViewer from "react-native-image-zoom-viewer";
import {HoleImageRouteProp} from "./homeStack";
import {saveRemoteImg} from "../../utils/saveImg";
import {getStr} from "../../utils/i18n";

export const HoleImageScreen = ({route}: {route: HoleImageRouteProp}) => {
	return (
		<View style={{flex: 1}}>
			{
				<ImageViewer
					imageUrls={[{url: route.params.url}]}
					onSave={saveRemoteImg}
					menuContext={{
						saveToLocal: getStr("holeSaveImage"),
						cancel: getStr("cancel"),
					}}
				/>
			}
		</View>
	);
};
