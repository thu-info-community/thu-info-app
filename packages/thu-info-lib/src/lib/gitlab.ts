import {InfoHelper} from "../index";
import {roamingWrapperWithMocks} from "./core";
import {stringify, uFetch} from "../utils/network";
import {GITLAB_API_BASE_URL} from "../constants/strings";
import {GitLabApiError} from "../utils/error";
import {MOCK_GIT_RECENT_PROJECTS} from "../mocks/gitlab";
import {Project} from "../models/gitlab/gitlab";

const fetchGitLab = async (path: string, query?: object, post?: object) => {
    try {
        return await uFetch(
            GITLAB_API_BASE_URL + path + (query ? `?${stringify(query)}` : ""),
            undefined,
            post
        ).then(JSON.parse);
    } catch {
        throw new GitLabApiError();
    }
};

const probeGitLab = async () => {
    await fetchGitLab("/version");
};

export const getRecentProjects = async (
    helper: InfoHelper,
    page: number,
): Promise<Project[]> =>
    roamingWrapperWithMocks(
        helper,
        "gitlab",
        "",
        async () => {
            const result = await fetchGitLab("/projects", {
                membership: true,
                archived: false,
                simple: true,
                order_by: "last_activity_at",
                page: page,
            });
            if (result.length === 0) {
                await probeGitLab();
            }
            return result;
        },
        MOCK_GIT_RECENT_PROJECTS,
    );
