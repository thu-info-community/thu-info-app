import "react-native-gesture-handler";
import React from "react";
import {AppRegistry, Platform, Text} from "react-native";
import { polyfill as polyfillBase64 } from 'react-native-polyfill-globals/src/base64';
import { polyfill as polyfillEncoding } from 'react-native-polyfill-globals/src/encoding';
import { polyfill as polyfillReadableStream } from 'react-native-polyfill-globals/src/readable-stream';
import { polyfill as polyfillURL } from 'react-native-polyfill-globals/src/url';
import { polyfill as polyfillCrypto } from 'react-native-polyfill-globals/src/crypto';
polyfillBase64();
polyfillEncoding();
polyfillReadableStream();
polyfillURL();
polyfillCrypto();
import {name} from "./app.json";
import {App} from "./src/App";
import AV from "leancloud-storage/core";
import * as adapters from "@leancloud/platform-adapters-react-native";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

const Buffer = require('buffer/').Buffer;
global.Buffer = Buffer;

const moment = require("moment");
require("moment/locale/zh-cn");
moment.locale("zh-cn");

dayjs.extend(customParseFormat);

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

// Fix MIUI12 font problem: https://segmentfault.com/a/1190000023622085

const defaultFontFamily = {
	...Platform.select({
		android: {fontFamily: ""},
	}),
};

const oldRender = Text.render;
Text.render = function (...args) {
	const origin = oldRender.call(this, ...args);
	return React.cloneElement(origin, {
		style: [defaultFontFamily, origin.props.style],
	});
};

AppRegistry.registerComponent(name, () => App);
