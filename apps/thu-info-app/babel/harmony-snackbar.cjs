module.exports = (api) => {
	const harmony = api.caller((caller) => caller?.platform === "harmony");
	return {
		visitor: {
			ImportDeclaration(path) {
				if (!harmony || path.node.source.value !== "react-native-snackbar") return;
				// Harmony's Snackbar v2 exposes a default export; Android/iOS v3
				// expose a named export. Adapt the bundle without rewriting sources.
				path.node.specifiers = path.node.specifiers.map((specifier) =>
					specifier.type === "ImportSpecifier" && specifier.imported.name === "Snackbar" ?
						api.types.importDefaultSpecifier(specifier.local) : specifier);
			},
		},
	};
};
