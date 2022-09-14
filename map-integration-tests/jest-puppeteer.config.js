module.exports = {
    launch: {
        headless: true,
        args: ["--ignore-certificate-errors", "--window-size=1366,768"],
        product: "chrome"
    },
    server: {
        command: "npm run start-webpack-dev-server",
        launchTimeout: 10000,
        host: "localhost",
        port: 9000,
        protocol: "https"
    }
};
