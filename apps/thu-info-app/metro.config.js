const {getDefaultConfig, mergeConfig} = require("@react-native/metro-config");
const {createHarmonyMetroConfig} = require("@react-native-oh/react-native-harmony/metro.config");
const path = require("path");

// Find the project and workspace directories
const projectRoot = __dirname;
// This can be replaced with `find-yarn-workspace-root`
const workspaceRoot = path.resolve(projectRoot, "../..");

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
	watchFolders: [workspaceRoot],
	resolver: {
		nodeModulesPaths: [
			path.resolve(projectRoot, "node_modules"),
			path.resolve(workspaceRoot, "node_modules"),
		],
	},
	server: {
		enhanceMiddleware: (middleware) => {
			return (req, res, next) => {
				// When an asset is imported outside the project root, it has wrong path on Android
				// So we fix the path to correct one
				if (/\/assets\/.+\.png\?platform=android.+$/.test(req.url)) {
					req.url = `/assets/../..${req.url}`;
				}

				return middleware(req, res, next);
			};
		},
	},
};

module.exports = mergeConfig(getDefaultConfig(__dirname), createHarmonyMetroConfig({
	reactNativeHarmonyPackageName: "@react-native-oh/react-native-harmony",
}), config);
