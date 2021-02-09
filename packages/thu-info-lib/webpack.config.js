const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

const htmlPlugin = new HtmlWebpackPlugin({
    template: "./demo/index.html",
    filename: "./index.html",
});

module.exports = {
    entry: {
        index: "./demo/index.ts",
    },
    output: {
        path: path.resolve("./dist"),
        filename: "[name].js",
    },
    plugins: [
        htmlPlugin,
        new NodePolyfillPlugin(),
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
        alias: {
            "parse5": path.resolve(__dirname, "src/fake-parse5/"),
            "parse5-htmlparser2-tree-adapter": path.resolve(__dirname, "src/fake-parse5/"),
        }
    },
    mode: "development",
    devtool: "inline-source-map",
};
