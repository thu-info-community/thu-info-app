const getLocales = () => [
	{countryCode: "CN", languageTag: "zh-CN", languageCode: "zh", isRTL: false},
];
const findBestAvailableLanguage = () => ({
	languageTag: "zh-CN",
	isRTL: false,
});

const getNumberFormatSettings = () => ({
	decimalSeparator: ".",
	groupingSeparator: ",",
});

const getCalendar = () => "gregorian";
const getCountry = () => "CN";
const getCurrencies = () => [];
const getTemperatureUnit = () => "celsius";
const getTimeZone = () => "China/Beijing";
const uses24HourClock = () => true;
const usesMetricSystem = () => true;

const addEventListener = jest.fn();
const removeEventListener = jest.fn();

export {
	findBestAvailableLanguage,
	getLocales,
	getNumberFormatSettings,
	getCalendar,
	getCountry,
	getCurrencies,
	getTemperatureUnit,
	getTimeZone,
	uses24HourClock,
	usesMetricSystem,
	addEventListener,
	removeEventListener,
};
