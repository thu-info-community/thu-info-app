import cheerio from "cheerio";
type Cheerio = ReturnType<typeof cheerio>;
type Element = Cheerio[number];
type Tag = Element & {type: "tag"};

export const getCheerioText = (element: Element, index?: number) =>
	index === undefined
		? (element as Tag).firstChild?.data?.trim() ?? ""
		: ((element as Tag).children[index] as Tag).firstChild?.data?.trim() ?? "";
