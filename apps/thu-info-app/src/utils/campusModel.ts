export const campusModelName = "DeepSeek-V4.1-Flash";

export const campusModelsTTL = 24 * 60 * 60 * 1000;

export interface CampusModelCache {
	models: string[];
	fetchedAt: number;
}

export const selectedCampusModel = (models: string[], preferred?: string) =>
	preferred && models.includes(preferred) ? preferred : models[0];
