import React from "react";
import {GitLabImageProp, RootNav} from "../../components/Root";
import {View} from "react-native";
import {GITLAB_API_BASE_URL} from "thu-info-lib/dist/constants/strings";
import ImageViewer from "react-native-image-zoom-viewer";
import {saveRemoteImg} from "../../utils/saveImg";
import {getStr} from "../../utils/i18n";

export const GitlabImageScreen = ({
	route: {
		params: {project, file},
	},
}: {
	navigation: RootNav;
	route: GitLabImageProp;
}) => {
	return (
		<View style={{flex: 1}}>
			<ImageViewer
				imageUrls={[
					{
						url: `${GITLAB_API_BASE_URL}/projects/${project.id}/repository/blobs/${file.id}/raw`,
					},
				]}
				onSave={saveRemoteImg}
				menuContext={{
					saveToLocal: getStr("saveImage"),
					cancel: getStr("cancel"),
				}}
			/>
		</View>
	);
};
