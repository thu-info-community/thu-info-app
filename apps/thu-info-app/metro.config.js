const {getDefaultConfig, mergeConfig} = require("@react-native/metro-config");
const path = require("path");

let createHarmonyMetroConfig = () => (option) => ({});
try {
	({createHarmonyMetroConfig} = require("@react-native-oh/react-native-harmony/metro.config"));
} catch {
	// Optional dependency `@react-native-oh/react-native-harmony` not found. Skipping Harmony config.
}

// Find the project and workspace directories
const projectRoot = __dirname;
// This can be replaced with `find-yarn-workspace-root`
const workspaceRoot = path.resolve(projectRoot, "../..");

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
	watchFolders: [workspaceRoot],
	resolver: {
		nodeModulesPaths: [
			path.resolve(workspaceRoot, "node_modules"),
			path.resolve(projectRoot, "node_modules"),
		],
		resolveRequest: (context, moduleImport, platform) => {
			if (
				moduleImport === "cheerio" ||
				moduleImport.startsWith("cheerio/")
			) {
				// Disable package exports only for this specific package
				return context.resolveRequest(
					{ ...context, unstable_enablePackageExports: false },
					moduleImport,
					platform,
				);
			}
			// Everything else uses normal resolution (with exports enabled)
			return context.resolveRequest(context, moduleImport, platform);
		},
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

module.exports = mergeConfig(getDefaultConfig(__dirname), config, createHarmonyMetroConfig({
	reactNativeHarmonyPackageName: "@react-native-oh/react-native-harmony",
}));
