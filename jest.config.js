module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    moduleDirectories: ['node_modules', 'core', 'map', 'services'],
    moduleNameMapper: {
        "@anw/go-sdk-js/core": "core"
    }
}