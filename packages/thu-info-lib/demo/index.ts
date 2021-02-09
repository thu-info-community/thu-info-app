import { InfoHelper } from "../src";

browser.browserAction.onClicked.addListener(() => {
    browser.tabs.create({
        url: "index.html",
    });
});

const helper = {InfoHelper};

(window as any).InfoHelper = helper;
