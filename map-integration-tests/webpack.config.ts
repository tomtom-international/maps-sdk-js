import HtmlWebpackPlugin from "html-webpack-plugin";
import path from "path";

module.exports = {
    entry: "./index.js",
    target: "web",
    mode: "development",
    devServer: { server: "https", port: 9001 },
    plugins: [new HtmlWebpackPlugin({ template: "./index.html", filename: "index.html", favicon: "./favicon.png" })],
    resolve: {
        alias: {
            /**
             * Here we create alias to be able to load the SDK to the browser from local builds
             * * For core we still use the original package name since the SDK map core will refer to it as well.
             */
            "@anw/maps-sdk-js/core": path.resolve("../core/dist/core.cjs.js"),
            localMapsSDKJSMap: path.resolve("../map/dist/map.cjs.js")
        }
    }
};
