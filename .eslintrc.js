module.exports = {
	root: true,
	extends: "@react-native-community",
	rules: {
		"react/react-in-jsx-scope": ["off"],
		"react/no-unstable-nested-components": ["off"],
		"react-native/no-inline-styles": ["off"],
		quotes: ["error", "double"],
		// https://github.com/eslint/eslint/issues/13640
		"no-shadow": ["off"],
		"@typescript-eslint/no-shadow": [1],
	},
};
