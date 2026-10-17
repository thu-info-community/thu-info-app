module.exports = {
	rootDir: "../..",
	testEnvironment: "node",
	testMatch: ["<rootDir>/test/agent/*.test.ts"],
	transform: {"^.+\\.[jt]sx?$": "babel-jest"},
	transformIgnorePatterns: ["node_modules/(?!(ai|@ai-sdk|@workflow|eventsource-parser|uuid)/)"],
};
