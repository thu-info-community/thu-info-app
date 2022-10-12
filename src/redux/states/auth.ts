export interface Auth {
	userId: string;
	password: string;
}

export const defaultAuth: Auth = {
	userId: "",
	password: "",
};
