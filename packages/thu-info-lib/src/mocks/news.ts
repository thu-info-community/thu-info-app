import {NewsSlice, ChannelTag} from "../models/news/news";

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
export const newsHtml = {} as {[key: string]: string};

const sampleHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Latest News</title>
  </head>
  <body>
    This is a sample news file.
  </body>
</html>
`;

newsHtml[url0] = sampleHtml;
newsHtml[url1] = sampleHtml;
newsHtml[url2] = sampleHtml;
newsHtml[url3] = sampleHtml;
newsHtml[url4] = sampleHtml;
newsHtml[url5] = sampleHtml;
newsHtml[url6] = sampleHtml;
newsHtml[url7] = sampleHtml;
newsHtml[url8] = sampleHtml;
newsHtml[url9] = sampleHtml;

export const MOCK_NEWS_LIST = (channel: ChannelTag): NewsSlice[] => {
    switch (channel) {
    case "LM_JWGG":
        return [
            {
                channel: "LM_JWGG",
                date: "2020.09.16",
                name: "博士生思政课“中国马克思主义与当代”扩容通知",
                source: "研究生院",
                url: url0,
                topped: false,
                xxid: "0",
                inFav: true,
            },
            {
                channel: "LM_JWGG",
                date: "2020.09.14",
                name: "研究生补退选时间安排（2020-2021秋）",
                source: "教务处",
                url: url1,
                topped: true,
                xxid: "0",
                inFav: false,
            },
            {
                channel: "LM_JWGG",
                date: "2020.09.14",
                name: "本科生补退选时间安排（2020-2021秋）",
                source: "教务处",
                url: url2,
                topped: true,
                xxid: "0",
                inFav: false,
            },
            {
                channel: "LM_JWGG",
                date: "2020.09.14",
                name: "2020-2021学年秋季学期SRT立项通知",
                source: "教务处",
                url: url3,
                topped: false,
                xxid: "0",
                inFav: true,
            },
        ];
    case "LM_BGTG":
        return [
            {
                channel: "LM_BGTG",
                date: "2020.09.17",
                name: "第二十二届清华大学创业大赛参赛报名通知",
                source: "校团委",
                url: url4,
                topped: false,
                xxid: "0",
                inFav: true,
            },
            {
                channel: "LM_BGTG",
                date: "2020.09.17",
                name: "清华大学“启·创”学生创业人才培育计划八期公开招募通知",
                source: "校团委",
                url: url5,
                topped: false,
                xxid: "0",
                inFav: true,
            },
            {
                channel: "LM_BGTG",
                date: "2020.09.17",
                name: "关于召开2020年度人事工作会的通知",
                source: "人事处",
                url: url6,
                topped: false,
                xxid: "0",
                inFav: false,
            },
        ];
    case "LM_HB":
        return [
            {
                channel: "LM_HB",
                date: "2020.09.17",
                name: "2020年10月三场“LIVE 逍遥夜”演出开票公告",
                source: "艺教中心办公室",
                url: url7,
                topped: false,
                xxid: "0",
                inFav: false,
            },
            {
                channel: "LM_HB",
                date: "2020.09.15",
                name:
                    "清华大学“唯真讲坛”系列在线理论宣讲活动第二十讲 当前的国际形势与热点问题",
                source: "党委宣传部",
                url: url8,
                topped: false,
                xxid: "0",
                inFav: false,
            },
            {
                channel: "LM_HB",
                date: "2020.09.14",
                name:
                    "金融科技还是科技金融？——数字刀如何切开金融蛋糕|清华五道口云课堂之金融大家评·华尔街热线（第15期）",
                source: "五道口金融学院综合办公室",
                url: url9,
                topped: false,
                xxid: "0",
                inFav: true,
            },
        ];
    default:
        return [];
    }
};
