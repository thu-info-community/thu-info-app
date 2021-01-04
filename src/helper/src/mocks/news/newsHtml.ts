/* eslint-disable no-undef */
// @ts-ignore
const prevalData = preval`
    const fs = require('fs');
    const path = require('path');
    const url0 = "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421e9fd528569336153301c9aa596522b20735d12f268e561f0/boarddetail_cat.jsp?columnId=0010106&itemSeq=46224";
    const url1 = "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421fae0429e207e6b597d469dbf915b243d8ae9128e1cdcffb247/jwcbg/detail_cat.jsp?boardid=57&seq=7632";
    const url2 = "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421fae0429e207e6b597d469dbf915b243d8ae9128e1cdcffb247/jwcbg/detail_cat.jsp?boardid=57&seq=7631";
    const url3 = "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421fae0429e207e6b597d469dbf915b243d8ae9128e1cdcffb247/jwcbg/detail_cat.jsp?boardid=57&seq=7627";
    const url4 = "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f2fa598421322653770bc7b88b5c2d32530b094045c3bd5cabf3/boarddetail_cat.jsp?columnId=xtw01&itemSeq=124715";
    const url5 = "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f2fa598421322653770bc7b88b5c2d32530b094045c3bd5cabf3/boarddetail_cat.jsp?columnId=xtw01&itemSeq=124712";
    const url6 = "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421e2e442d23323615e79009cadd650272001f8dd/rscbg/detail.jsp?boardid=22&seq=5182";
    const url7 = "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421e0f852882e3e6e5f301c9aa596522b2043f84ba24ebecaf8/node/279771";
    const url8 = "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f2fa598421322653770bc7b88b5c2d32530b094045c3bd5cabf3/boarddetail_cat.jsp?columnId=dwxcb01&itemSeq=124530";
    const url9 = "https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421e0f852882e3e6e5f301c9aa596522b2043f84ba24ebecaf8/node/279661";
    const result = {};
    let flag = false;
    if (process.cwd().includes("ios")) {
        process.chdir('..')
        flag = true;
    }
    result[url0] = fs.readFileSync(path.resolve(process.cwd(), './src/helper/src/mocks/news/0.html'), 'utf8');
    result[url1] = fs.readFileSync(path.resolve(process.cwd(), './src/helper/src/mocks/news/1.html'), 'utf8');
    result[url2] = fs.readFileSync(path.resolve(process.cwd(), './src/helper/src/mocks/news/2.html'), 'utf8');
    result[url3] = fs.readFileSync(path.resolve(process.cwd(), './src/helper/src/mocks/news/3.html'), 'utf8');
    result[url4] = fs.readFileSync(path.resolve(process.cwd(), './src/helper/src/mocks/news/4.html'), 'utf8');
    result[url5] = fs.readFileSync(path.resolve(process.cwd(), './src/helper/src/mocks/news/5.html'), 'utf8');
    result[url6] = fs.readFileSync(path.resolve(process.cwd(), './src/helper/src/mocks/news/6.html'), 'utf8');
    result[url7] = fs.readFileSync(path.resolve(process.cwd(), './src/helper/src/mocks/news/7.html'), 'utf8');
    result[url8] = fs.readFileSync(path.resolve(process.cwd(), './src/helper/src/mocks/news/8.html'), 'utf8');
    result[url9] = fs.readFileSync(path.resolve(process.cwd(), './src/helper/src/mocks/news/9.html'), 'utf8');
    if (flag) {
        process.chdir('ios')
    }
    module.exports = {
        url0,
        url1,
        url2,
        url3,
        url4,
        url5,
        url6,
        url7,
        url8,
        url9,
        newsHtml: result,
    };
` as {
	newsHtml: {[key: string]: string};
	url0: string;
	url1: string;
	url2: string;
	url3: string;
	url4: string;
	url5: string;
	url6: string;
	url7: string;
	url8: string;
	url9: string;
};

export const {
	newsHtml,
	url0,
	url1,
	url2,
	url3,
	url4,
	url5,
	url6,
	url7,
	url8,
	url9,
} = prevalData;
