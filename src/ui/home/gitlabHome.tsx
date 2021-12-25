import React from "react";
import {helper} from "../../redux/store";
import {paginatedRefreshListScreen} from "../../components/settings/paginatedRefreshListScreen";
import {ProjectItem} from "../../components/home/gitlab";

export const GitlabHomeScreen = paginatedRefreshListScreen(
	(_, page) => helper.getGitRecentProjects(page),
	(item) => <ProjectItem project={item} onPress={() => {}} />,
	({id}) => String(id),
);
