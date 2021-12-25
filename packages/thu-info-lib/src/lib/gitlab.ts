import {InfoHelper} from "../index";
import {roamingWrapperWithMocks} from "./core";
import {stringify, uFetch} from "../utils/network";
import {GITLAB_API_BASE_URL} from "../constants/strings";
import {GitLabApiError} from "../utils/error";
import {MOCK_GIT_NAMESPACES, MOCK_GIT_PERSONAL_PROJECTS, MOCK_GIT_RECENT_PROJECTS} from "../mocks/gitlab";
import {File, Namespace, Project, ProjectDetail} from "../models/gitlab/gitlab";

const fetchGitLabRaw = async (path: string, query?: object, post?: object) => {
    try {
        return await uFetch(
            GITLAB_API_BASE_URL + path + (query ? `?${stringify(query)}` : ""),
            post ? JSON.stringify(post) as never as object : undefined,
            60000,
            "UTF-8",
            true,
            "application/json",
        );
    } catch {
        throw new GitLabApiError();
    }
};

const fetchGitLab = async (path: string, query?: object, post?: object) => {
    try {
        return await fetchGitLabRaw(path, query, post).then(JSON.parse);
    } catch {
        throw new GitLabApiError();
    }
};

const probeGitLab = async () => {
    await fetchGitLab("/version");
};

export const getNamespaces = async (
    helper: InfoHelper,
    page: number,
): Promise<Namespace[]> =>
    roamingWrapperWithMocks(
        helper,
        "gitlab",
        "",
        async () => {
            return await fetchGitLab("/namespaces", {page: page});
        },
        MOCK_GIT_NAMESPACES,
    );

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

export const getPersonalProjects = async (
    helper: InfoHelper,
    name: string,
    page: number,
): Promise<Project[]> =>
    roamingWrapperWithMocks(
        helper,
        "gitlab",
        "",
        async () => {
            const result = await fetchGitLab(`/users/${name}/projects`, {
                simple: true,
                order_by: "last_activity_at",
                page: page,
            });
            if (result.length === 0) {
                await probeGitLab();
            }
            return result;
        },
        MOCK_GIT_PERSONAL_PROJECTS,
    );

export const searchProjects = async (
    helper: InfoHelper,
    search: string,
): Promise<Project[]> =>
    roamingWrapperWithMocks(
        helper,
        "gitlab",
        "",
        async () => {
            return await fetchGitLab("/search", {scope: "projects", search});
        },
        [],
    );

export const getProjectDetail = async (
    helper: InfoHelper,
    id: number,
): Promise<ProjectDetail> =>
    roamingWrapperWithMocks(
        helper,
        "gitlab",
        "",
        async () => {
            return await fetchGitLab(`/projects/${id}`);
        },
        [],
    );

export const getProjectTree = async (
    helper: InfoHelper,
    id: number,
    path: string,
    ref: string,
    page: number,
): Promise<File[]> =>
    roamingWrapperWithMocks(
        helper,
        "gitlab",
        "",
        async () => {
            return await fetchGitLab(`/projects/${id}/repository/tree`, {path, ref, page});
        },
        [],
    );

export const getProjectFileBlob = async (
    helper: InfoHelper,
    id: number,
    sha: string,
): Promise<string> =>
    roamingWrapperWithMocks(
        helper,
        "gitlab",
        "",
        async () => {
            return await fetchGitLabRaw(`/projects/${id}/repository/blobs/${sha}/raw`);
        },
        "",
    );

export const renderMarkdown = async (
    helper: InfoHelper,
    text: string,
): Promise<string> =>
    roamingWrapperWithMocks(
        helper,
        "gitlab",
        "",
        async () => {
            return (await fetchGitLab("/markdown", undefined, {text})).html;
        },
        "",
    );
