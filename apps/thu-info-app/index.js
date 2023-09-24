import "react-native-gesture-handler";
import React from "react";
import {AppRegistry, Text} from "react-native";
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

const oldRender = Text.render;
Text.render = function (props, ...extraArgs) {
	return oldRender.call(
		this,
		{...props, textBreakStrategy: "simple"},
		...extraArgs,
	);
};

AppRegistry.registerComponent(name, () => App);
