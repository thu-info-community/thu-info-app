export type AppPlatform = "ios" | "android" | "harmony";

export interface Version {
    versionName: string;
    releaseNote: string;
    downloadUrl: string;
    versionCode?: number;
}
