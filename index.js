import "react-native-gesture-handler";
import React from "react";
import {AppRegistry, LogBox, Platform, Text} from "react-native";
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
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

const Buffer = require('buffer/').Buffer;
global.Buffer = Buffer;

const moment = require("moment");
require("moment/locale/zh-cn");
moment.locale("zh-cn");

dayjs.extend(customParseFormat);

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
		textBreakStrategy: "simple",
	});
};

LogBox.ignoreLogs(["ViewPropTypes will be removed from React Native. Migrate to ViewPropTypes exported from 'deprecated-react-native-prop-types'."]);

AppRegistry.registerComponent(name, () => App);
