/* Prepare for npm installation */

const isCi = process.env.CI !== undefined;

if (!isCi) {
    require('husky').install();
}
