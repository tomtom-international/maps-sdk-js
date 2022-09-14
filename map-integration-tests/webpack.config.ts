import HtmlWebpackPlugin from "html-webpack-plugin";
import path from "path";

module.exports = {
    entry: "./src/index.js",
    target: "web",
    mode: "development",
    devServer: {
        http2: true,
        port: 9000
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./index.html",
            filename: "index.html"
        })
    ],
    resolve: {
        alias: {
            localGOSDKJSMap: path.resolve("../map/dist/map.cjs.min.js"),
            "@anw/go-sdk-js/core": path.resolve("../core/dist/core.cjs.min.js")
        }
    }
};
