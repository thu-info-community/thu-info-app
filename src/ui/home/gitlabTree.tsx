import React, {PropsWithChildren} from "react";
import {helper} from "../../redux/store";
import {paginatedRefreshListScreen} from "../../components/settings/paginatedRefreshListScreen";
import {GitLabTreeProp, HomeNav} from "./homeStack";
import {FileItem} from "../../components/home/gitlab";
import {Alert} from "react-native";
import {getStr} from "../../utils/i18n";
import RNFS from "react-native-fs";
import Snackbar from "react-native-snackbar";
import CookieManager from "@react-native-community/cookies";
import {GITLAB_API_BASE_URL} from "thu-info-lib/dist/constants/strings";

export const GitlabTreeScreen = paginatedRefreshListScreen(
	(
		{
			route: {
				params: {project, path, ref},
			},
		}: PropsWithChildren<{
			navigation: HomeNav;
			route: GitLabTreeProp;
		}>,
		page,
	) => helper.getGitProjectTree(project.id, path, ref, page),
	(
		file,
		_,
		{
			navigation,
			route: {
				params: {project, path, ref},
			},
		},
	) => (
		<FileItem
			file={file}
			onPress={() => {
				if (file.type === "tree") {
					navigation.push("GitLabTree", {
						project,
						path: path + file.name + "/",
						ref,
					});
				} else if (file.name.toLowerCase().endsWith(".pdf")) {
					CookieManager.get("https://webvpn.tsinghua.edu.cn")
						.then((r) =>
							Object.values(r)
								.map(({name, value}) => `${name}=${value}`)
								.join(";"),
						)
						.then((cookie) =>
							navigation.navigate("GitLabPDF", {project, file, cookie}),
						);
				} else {
					navigation.navigate("GitLabCode", {project, file});
				}
			}}
			onLongPress={() => {
				if (file.type === "blob") {
					Alert.alert(
						getStr("download"),
						getStr("download") + " " + file.name,
						[
							{
								text: getStr("cancel"),
								style: "cancel",
							},
							{
								text: getStr("confirm"),
								onPress: () => {
									Snackbar.show({
										text: getStr("downloading"),
										duration: Snackbar.LENGTH_SHORT,
									});
									CookieManager.get("https://webvpn.tsinghua.edu.cn")
										.then((r) =>
											Object.values(r)
												.map(({name, value}) => `${name}=${value}`)
												.join(";"),
										)
										.then((cookies) => {
											RNFS.downloadFile({
												fromUrl: `${GITLAB_API_BASE_URL}/projects/${project.id}/repository/blobs/${file.id}/raw`,
												toFile: RNFS.DownloadDirectoryPath + "/" + file.name,
												headers: {Cookie: cookies},
											})
												.promise.then(() =>
													Snackbar.show({
														text: getStr("success"),
														duration: Snackbar.LENGTH_SHORT,
													}),
												)
												.catch((e) => {
													Snackbar.show({
														text:
															typeof e.message === "string"
																? e.message
																: getStr("networkRetry"),
														duration: Snackbar.LENGTH_SHORT,
													});
												});
										});
								},
							},
						],
						{cancelable: true},
					);
				}
			}}
		/>
	),
	({id}) => String(id),
);
