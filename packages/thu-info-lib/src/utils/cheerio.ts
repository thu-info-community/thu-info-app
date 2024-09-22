import * as cheerio from "cheerio";
import type {ElementType} from "domelementtype";
import type {DataNode, Element, Node} from "domhandler";
type Tag = Element & {type: ElementType.Tag};

// TODO: Merge two functions
export const getCheerioText = (element: Node, index?: number) =>
    index === undefined
        ? ((element as Tag).firstChild as DataNode)?.data?.trim() ?? ""
        : (((element as Tag).children[index] as Tag).firstChild as DataNode)?.data?.trim() ?? "";

export const getTrimmedData = (element: Element, indexChain: number[]) => {
    const tElement = cheerio.load(element)("td");
    try {
        let res = tElement[indexChain[0]];
        indexChain
            .slice(1)
            .forEach((val) => {
                res = (res as Tag).children[val] as Element;
            });

        return (res as Node as DataNode).data?.trim() ?? "";
    } catch {
        return "";
    }
};
