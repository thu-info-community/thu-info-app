import React from "react";
import {GitLabPDFProp, RootNav} from "../../components/Root";
import {Dimensions, StyleSheet, View} from "react-native";
import Pdf from "react-native-pdf";
import {GITLAB_API_BASE_URL} from "thu-info-lib/dist/constants/strings";

export const GitlabPDFScreen = ({
	route: {
		params: {project, file, cookie},
	},
}: {
	navigation: RootNav;
	route: GitLabPDFProp;
}) => {
	return (
		<View style={styles.container}>
			<Pdf
				style={styles.pdf}
				source={{
					uri: `${GITLAB_API_BASE_URL}/projects/${project.id}/repository/blobs/${file.id}/raw`,
					headers: {Cookie: cookie},
				}}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "flex-start",
		alignItems: "center",
		marginTop: 25,
	},
	pdf: {
		flex: 1,
		width: Dimensions.get("window").width,
		height: Dimensions.get("window").height,
	},
});
