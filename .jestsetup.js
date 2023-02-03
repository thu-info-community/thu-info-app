import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";

import mockRNDeviceInfo from 'react-native-device-info/jest/react-native-device-info-mock'
jest.mock('react-native-device-info', () => mockRNDeviceInfo)
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

jest.mock("react-native-localize", () => ({
	findBestAvailableLanguage: () => ({
		languageTag: "zh-CN",
		isRTL: false,
	}),
	getLocales: () => [
		{countryCode: "CN", languageTag: "zh-CN", languageCode: "zh", isRTL: false},
	],
	getNumberFormatSettings: () => ({
		decimalSeparator: ".",
		groupingSeparator: ",",
	}),
	getCalendar: () => "gregorian",
	getCountry: () => "CN",
	getCurrencies: () => [],
	getTemperatureUnit: () => "celsius",
	getTimeZone: () => "China/Beijing",
	uses24HourClock: () => true,
	usesMetricSystem: () => true,
	addEventListener: jest.fn(),
	removeEventListener: jest.fn(),
}));

global.console = {
	log: console.log,
	error: jest.fn((message) => {
		try {
			if (
				message.indexOf(
					"An update to CardContainer inside a test was not wrapped in act(...).",
				) === -1
			) {
				console.error(message);
			}
		} catch (e) {}
	}),
	warn: jest.fn((message) => {
		try {
			if (
				message.indexOf(
					"react-native-blob-util could not find valid native module.",
				) === -1
			) {
				console.warn(message);
			}
		} catch (e) {}
	}),
	info: console.info,
	debug: console.debug,
};

jest.mock('react-native-fs', () => ({
		DocumentDirectoryPath: "",
		downloadFile: jest.fn(),
	}),
);

jest.mock("react-native-reanimated", () => {
	const Reanimated = require("react-native-reanimated/mock");
	Reanimated.default.call = () => {};
	return Reanimated;
});

jest.mock("react-native-view-shot", () => ({
	RNViewShot: jest.fn().mockResolvedValue(),
}));

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

jest.mock("react-native-keychain", () => ({
	SECURITY_LEVEL_ANY: "MOCK_SECURITY_LEVEL_ANY",
	SECURITY_LEVEL_SECURE_SOFTWARE: "MOCK_SECURITY_LEVEL_SECURE_SOFTWARE",
	SECURITY_LEVEL_SECURE_HARDWARE: "MOCK_SECURITY_LEVEL_SECURE_HARDWARE",
	setGenericPassword: jest.fn().mockResolvedValue(),
	getGenericPassword: jest.fn().mockResolvedValue(),
	resetGenericPassword: jest.fn().mockResolvedValue(),
}));

jest.mock("react-native-snackbar", () => ({LENGTH_LONG: 0, LENGTH_SHORT: 0, show: jest.fn()}));

jest.mock("@react-native-cookies/cookies", () => ({
	clearAll: jest.fn().mockResolvedValue(),
}));

jest.mock('redux-persist/lib/integration/react', () => ({
	PersistGate: ({children}) => children
}))

jest.mock("redux-persist/lib/createPersistoid", () =>
	jest.fn(() => ({
		update: jest.fn(),
		flush: jest.fn(),
	})),
);

jest.mock("react-native-blob-util/fs", () => ({dirs: {
	DocumentDir: "",
	CacheDir: "",
	PictureDir: "",
	MusicDir: "",
	MovieDir: "",
	DownloadDir: "",
	DCIMDir: "",
	SDCardDir: "", // Depracated
	SDCardApplicationDir: "", // Deprecated
	MainBundleDir: "",
	LibraryDir: "",
}}));

jest.mock('react-native-permissions', () => require('react-native-permissions/mock'));

jest.mock("react-native-version-number", () => ({
	appVersion: "0.0.0",
	buildVersion: "0",
	bundleIdentifier: "0",
}));

jest.mock('react-native-webview', () => jest.fn())

jest.mock("./src/utils/webApi", () => ({
	getLatestAnnounces: () => Promise.resolve([]),
	getLatestVersion: () => Promise.resolve([{
		versionName: "0.0.0",
		url: "",
		description: "",
	}]),
	FunctionType: {},
	addUsageStat: () => {},
	addStartupStat: ()=> {},
}));
