const path = require("path");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = {
    entry: {
        index: "./demo/index.ts",
    },
    output: {
        path: path.resolve("./demo"),
        filename: "[name].js",
    },
    plugins: [
        new NodePolyfillPlugin({
            excludeAliases: ["Buffer"],
        }),
    ],
    devServer: {
        contentBase: "./dist",
        headers: {
            "Access-Control-Allow-Origin": "*",
        },
    },
    module: {
        rules: [
            {
                exclude: /node_modules/,
                test: /\.tsx?$/,
                use: "ts-loader",
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
    },
    externals: {
        "rtn-network-utils": "rtn-network-utils",
    },
    mode: "development",
    devtool: "inline-source-map",
};
