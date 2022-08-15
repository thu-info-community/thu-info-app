import cheerio from "cheerio";
type Cheerio = ReturnType<typeof cheerio>;
type Element = Cheerio[number];
type Tag = Element & {type: "tag"};

// TODO: Merge two functions
export const getCheerioText = (element: Element, index?: number) =>
    index === undefined
        ? (element as Tag).firstChild?.data?.trim() ?? ""
        : ((element as Tag).children[index] as Tag).firstChild?.data?.trim() ?? "";

export const getTrimmedData = (element: Element, indexChain: number[]) => {
    const tElement = cheerio(element);
    try {
        let res = tElement.children()[indexChain[0]];
        indexChain
            .slice(1)    
            .forEach((val) => {
                res = (res as Tag).children[val];
            });

        return res.data?.trim() ?? "";
    } catch {
        return "";
    }
};
