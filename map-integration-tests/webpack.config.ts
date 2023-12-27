import HtmlWebpackPlugin from "html-webpack-plugin";
import path from "path";

module.exports = {
    entry: "./index.js",
    target: "web",
    mode: "development",
    devServer: { http2: true, port: 9001 },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./index.html",
            filename: "index.html",
            favicon: "./favicon.png"
        })
    ],
    resolve: {
        alias: {
            localMapsSDKJSMap: path.resolve("../map/dist/map.cjs.js"),
            "@anw/maps-sdk-js/core": path.resolve("../core/dist/core.cjs.js")
        }
    }
};
