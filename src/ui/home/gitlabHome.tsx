import React, {PropsWithChildren} from "react";
import {helper} from "../../redux/store";
import {paginatedRefreshListScreen} from "../../components/settings/paginatedRefreshListScreen";
import {ProjectItem} from "../../components/home/gitlab";
import {HomeNav} from "./homeStack";

export const GitlabHomeScreen = paginatedRefreshListScreen(
	(_: PropsWithChildren<{navigation: HomeNav}>, page) =>
		helper.getGitRecentProjects(page),
	(project, _, {navigation}) => (
		<ProjectItem
			project={project}
			onPress={() => {
				navigation.navigate("GitLabProject", {project});
			}}
		/>
	),
	({id}) => String(id),
);
