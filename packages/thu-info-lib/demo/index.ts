import {InfoHelper} from "../src";

// @ts-ignore
browser.browserAction.onClicked.addListener(() => {
    // @ts-ignore
    browser.tabs.create({
        url: "index.html",
    });
});

(window as any).InfoHelper = {InfoHelper};
