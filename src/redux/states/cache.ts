export interface NewsCache {
	url: string;
	timestamp: number;
	abstract: string;
}

export interface Cache {
	news: NewsCache[];
}
