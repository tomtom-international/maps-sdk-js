module.exports = {
    launch: {
        headless: false,
        product: "chrome",
        args: [
            "--ignore-certificate-errors",
            "--window-size=800,750",
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--no-first-run",
            "--no-zygote",
            "--single-process"
        ]
    },
    server: {
        command: "npm run start-webpack-dev-server",
        launchTimeout: 10000,
        port: 9001
    }
};
