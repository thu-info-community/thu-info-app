import path from "path";

module.exports = {
	process(src, filename) {
		return "module.exports = " + JSON.stringify(path.basename(filename)) + ";";
	},
};
