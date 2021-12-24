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
}
