import {InfoHelper} from "./dist";

(async () => {
    const helper = new InfoHelper();
    await helper.login(
        {
            userId: "", // Fill your credentials information here
            password: "",
            dormPassword: "",
        },
        undefined,
    );
    console.log(`I bet your email address is: ${helper.emailName}@mails.tsinghua.edu.cn`);

    // Go on with your code here.

})().catch(console.error);
