module.exports = {
	root: true,
	extends: "@react-native-community",
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint"],
	rules: {
		"react-native/no-inline-styles": ["off"],
		quotes: ["error", "double"],
		// https://github.com/eslint/eslint/issues/13640
		"no-shadow": ["off"],
		"@typescript-eslint/no-shadow": [1],
	},
};
