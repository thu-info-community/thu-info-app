import React, {PropsWithChildren} from "react";
import {helper} from "../../redux/store";
import {paginatedRefreshListScreen} from "../../components/settings/paginatedRefreshListScreen";
import {ProjectItem} from "../../components/home/gitlab";
import {RootNav} from "../../components/Root";

export const GitlabHomeScreen = paginatedRefreshListScreen(
	(_: PropsWithChildren<{navigation: RootNav}>, page) =>
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

export const GitlabStarredScreen = paginatedRefreshListScreen(
	(_: PropsWithChildren<{navigation: RootNav}>, page) =>
		helper.getGitStarredProjects(page),
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
