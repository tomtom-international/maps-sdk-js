module.exports = {
    launch: {
        headless: "new",
        args: ["--ignore-certificate-errors", "--window-size=800,750"],
        product: "chrome",
        waitForInitialPage: false
    },
    server: {
        command: "npm run start-webpack-dev-server",
        launchTimeout: 10000,
        port: 9001
    }
};
