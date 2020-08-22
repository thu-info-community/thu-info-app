import "react-native-gesture-handler";
import {AppRegistry} from "react-native";
import {name} from "./app.json";
import {App} from "./src/App";
import AV from "leancloud-storage/core";
import * as adapters from "@leancloud/platform-adapters-react-native";

// 由于代（ren）码（bi）开（jiao）源（lan），我决定公开LeanCloud相应密钥。
// 我也希望除我以外的任何人不要使用以下信息访问相关数据库。
// （况且目前看即使访问，能看到的也只有bug report和api统计）

AV.setAdapters(adapters);
// noinspection SpellCheckingInspection
AV.init({
	appId: "xbf9yBV8zr2zMwRwOjGLXNNz-gzGzoHsz",
	appKey: "cxQfkadtrY7iQSl7HI4rlrGx",
	serverURL: "https://xbf9ybv8.lc-cn-n1-shared.com",
});

AppRegistry.registerComponent(name, () => App);
