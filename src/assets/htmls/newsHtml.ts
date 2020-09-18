/* eslint-disable no-undef */
// @ts-ignore
const prevalData = preval`
    const fs = require('fs');
    const path = require('path');
    const url0 = "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421e9fd528569336153301c9aa596522b20735d12f268e561f0/boarddetail_cat.jsp?columnId=0010106&itemSeq=46224";
    const url1 = "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421fae0429e207e6b597d469dbf915b243d8ae9128e1cdcffb247/jwcbg/detail_cat.jsp?boardid=57&seq=7632";
    const result = {};
    let flag = false;
    if (process.cwd().includes("ios")) {
        process.chdir('..')
        flag = true;
    }
    result[url0] = fs.readFileSync(path.resolve(process.cwd(), './src/assets/htmls/0.html'), 'utf8');
    result[url1] = fs.readFileSync(path.resolve(process.cwd(), './src/assets/htmls/1.html'), 'utf8');
    if (flag) {
        process.chdir('ios')
    }
    module.exports = {
        url0,
        url1,
        newsHtml: result,
    };
` as {
	newsHtml: {[key: string]: string};
	url0: string;
	url1: string;
};

export const newsHtml = prevalData.newsHtml;
export const url0 = prevalData.url0;
export const url1 = prevalData.url1;
