import {Namespace, Project, ProjectDetail} from "../models/gitlab/gitlab";

const SAMPLE_PROJECT = {
    id: 0,
    description: "Sample Project",
    name: "sample",
    name_with_namespace: "test/sample",
    path: "sample",
    path_with_namespace: "test/sample",
    created_at: "",
    default_branch: "main",
    forks_count: 0,
    star_count: 0,
    last_activity_at: "",
    namespace: {
        id: 0,
        name: "test",
        path: "test",
        kind: "test",
        full_path: "test",
        parent_id: 0,
    },
};

export const MOCK_GIT_NAMESPACES = [] as Namespace[];

export const MOCK_GIT_RECENT_PROJECTS = [SAMPLE_PROJECT] as Project[];

export const MOCK_GIT_PERSONAL_PROJECTS = [SAMPLE_PROJECT] as Project[];

export const MOCK_PROJECT_DETAIL = {
    ...SAMPLE_PROJECT,
    empty_repo: true,
    archived: false,
    visibility: "private",
    owner: {
        id: 0,
        name: "test",
        username: "test",
        state: "active",
    },
    issues_enabled: false,
    merge_requests_enabled: false,
    wiki_enabled: false,
    jobs_enabled: false,
    snippets_enabled: false,
    can_create_merge_request_in: false,
    open_issues_count: 0,
} as ProjectDetail;

export const MOCK_PROJECT_BRANCH = {
    name: "main",
    merged: true,
    protected: true,
    developers_can_push: true,
    developers_can_merge: true,
    can_push: true,
    default: true,
    commit: {
        id: "test",
        short_id: "test",
        created_at: "",
        title: "Initial commit",
        message: "",
        author_name: "test",
        author_email: "someone@example.com",
        authored_date: "",
        committer_name: "test",
        committer_email: "someone@example.com",
        committed_date: "",
    },
};
