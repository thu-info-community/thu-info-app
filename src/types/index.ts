declare module "cheerio" {
	export interface CheerioElement {
		tagName: string;
		type: string;
		name: string;
		attribs: {[attr: string]: string};
		children: CheerioElement[];
		childNodes: CheerioElement[];
		lastChild: CheerioElement;
		firstChild: CheerioElement;
		next: CheerioElement;
		nextSibling: CheerioElement;
		prev: CheerioElement;
		previousSibling: CheerioElement;
		parent: CheerioElement;
		parentNode: CheerioElement;
		nodeValue: string;
		data?: string;
		startIndex?: number;
	}
}
