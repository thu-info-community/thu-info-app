export interface Namespace {
    id: number;
    name: string;
    path: string;
    kind: string;
    full_path: string;
    parent_id: number;
}

export interface User {
    id: number;
    name: string;
    username: string;
    state: string;
}

export interface Project {
    id: number;
    description: string;
    name: string;
    name_with_namespace: string;
    path: string;
    path_with_namespace: string;
    created_at: string;
    default_branch: string;
    forks_count: number;
    star_count: number;
    last_activity_at: string;
    namespace: Namespace;
}

export interface ProjectDetail extends Project {
    empty_repo: boolean;
    archived: boolean;
    visibility: "private" | "internal" | "public";
    owner: User;
    issues_enabled: boolean;
    merge_requests_enabled: boolean;
    wiki_enabled: boolean;
    jobs_enabled: boolean;
    snippets_enabled: boolean;
    can_create_merge_request_in: boolean;
    open_issues_count: number;
}

export interface File {
    id: string;
    name: string;
    type: "tree" | "blob";
    path: string;
    mode: string;
}
