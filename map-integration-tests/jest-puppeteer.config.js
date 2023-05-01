module.exports = {
    launch: {
        headless: false,
        args: ["--ignore-certificate-errors", "--window-size=800,600"],
        product: "chrome"
    },
    server: {
        command: "npm run start-webpack-dev-server",
        launchTimeout: 10000,
        port: 9001
    }
};
