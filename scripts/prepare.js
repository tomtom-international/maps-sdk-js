/* Prepare for npm installation */

const isCI = process.env.CI !== undefined;

if (!isCI) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("husky").install();
}
