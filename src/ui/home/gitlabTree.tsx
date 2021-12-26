import React, {PropsWithChildren} from "react";
import {helper} from "../../redux/store";
import {paginatedRefreshListScreen} from "../../components/settings/paginatedRefreshListScreen";
import {GitLabTreeProp, HomeNav} from "./homeStack";
import {FileItem} from "../../components/home/gitlab";

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
				} else {
					navigation.navigate("GitLabCode", {project, file});
				}
			}}
		/>
	),
	({id}) => String(id),
);
