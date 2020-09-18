/* eslint-disable no-undef */
// @ts-ignore
const prevalData = preval`
    const fs = require('fs');
    const path = require('path');
    const url0 = "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421e9fd528569336153301c9aa596522b20735d12f268e561f0/boarddetail_cat.jsp?columnId=0010106&itemSeq=46224";
    const url1 = "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421fae0429e207e6b597d469dbf915b243d8ae9128e1cdcffb247/jwcbg/detail_cat.jsp?boardid=57&seq=7634";
    let str;
    if (process.cwd().includes("ios")) {
        str = fs.readFileSync(path.resolve(process.cwd(), '../src/assets/htmls/0.html'), 'utf8');
    } else {
        str = fs.readFileSync(path.resolve(process.cwd(), './src/assets/htmls/0.html'), 'utf8');
    }
    const result = {};
    result[url0] = str;
    if (process.cwd().includes("ios")) {
        str = fs.readFileSync(path.resolve(process.cwd(), '../src/assets/htmls/1.html'), 'utf8');
    } else {
        str = fs.readFileSync(path.resolve(process.cwd(), './src/assets/htmls/1.html'), 'utf8');
    }
    result[url1] = str;
    module.exports = {
        url0,
        url1,
        newsHtml: result,
    };
`;

export const newsHtml = prevalData.newsHtml;
export const url0 = prevalData.url0;
export const url1 = prevalData.url1;
