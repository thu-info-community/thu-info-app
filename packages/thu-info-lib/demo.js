import {InfoHelper} from "./dist";
import {question, keyInYNStrict} from "readline-sync";

(async () => {
    const userId = question("请输入学号：");
    const password = question("请输入密码：", { hideEchoBack: true });
    const helper = new InfoHelper();
    await helper.login(
        {
            userId: userId,
            password: password,
        },
    );

    // Go on with your code here.

    if (keyInYNStrict("测试点一：获取成绩单。是否进行测试？")) {
        try {
            const report = await helper.getReport(false, true);
            console.log(`共有 ${report.length} 条成绩记录。`);
            console.log("测试点一通过。");
        } catch (e) {
            console.error(e);
            console.error("测试点一未通过。");
        }
    }

    if (keyInYNStrict("测试点二：获取新闻动态。是否进行测试？")) {
        try {
            const news = await helper.getNewsList(1, 20);
            console.log(`共有 ${news.length} 条新闻记录。`);
            if (news.length === 20) {
                console.log("测试点二通过。");
            } else {
                console.error("测试点二未通过。");
            }
        } catch (e) {
            console.error(e);
            console.error("测试点二未通过。");
        }
    }

    if (keyInYNStrict("测试点三：获取课程表。是否进行测试？")) {
        try {
            const schedule = await helper.getSchedule(1, 20);
            console.log(`共有 ${schedule.length} 条课程表记录。`);
            console.log("测试点三通过。");
        } catch (e) {
            console.error(e);
            console.error("测试点三未通过。");
        }
    }

    if (keyInYNStrict("测试点四：获取校园卡消费记录。是否进行测试？")) {
        try {
            const expenditures = await helper.getExpenditures();
            console.log(`共有 ${expenditures.length} 条校园卡消费记录。`);
            console.log("测试点四通过。");
        } catch (e) {
            console.error(e);
            console.error("测试点四未通过。");
        }
    }

    if (keyInYNStrict("测试点五：获取宿舍电费余额。是否进行测试？")) {
        try {
            const {remainder} = await helper.getEleRemainder();
            console.log(`余额 ${remainder} 度。`);
            console.log("测试点五通过。");
        } catch (e) {
            console.error(e);
            console.error("测试点五未通过。");
        }
    }

})().catch(console.error);
