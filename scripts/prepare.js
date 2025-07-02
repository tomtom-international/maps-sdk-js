/* Prepare for npm installation */

const isCI = process.env.CI !== undefined;

if (!isCI) {
    require('husky').install();
}
