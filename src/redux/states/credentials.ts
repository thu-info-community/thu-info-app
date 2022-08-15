export interface Credentials {
	dormPassword: string;
	appSecret: string | undefined;
}

export const defaultCredentials: Credentials = {
	dormPassword: "",
	appSecret: undefined,
};
