/**
 * Dynamically generate a navigation.yml file for the API reference. navigation.yml is a file used by devportal to
 * determine which pages get generated and what content gets added to the left sidebar.
 *
 * Creates navigation.yml file entries for all the extra generated documentation files, i.e. files that aren't part
 * of the navigation side-menu in devportal, but should still be accessible. These entries are appended to the contents
 * of base-navigation.yml and written to a navigation.yml file.
 */

import { readdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const DOCUMENTATION_DIR_PATH = resolve(__dirname, "../../documentation/dev-portal/javascript/maps/documentation/");
const API_REFERENCE_DIR_PATH = resolve(DOCUMENTATION_DIR_PATH, "api-reference");
const BASE_NAV_FILE_PATH = resolve(DOCUMENTATION_DIR_PATH, "../../../base-navigation.yml");
const OUTPUT_NAV_FILE_NAME = "navigation.yml";

const getAllApiReferenceFileNames = () => readdirSync(API_REFERENCE_DIR_PATH).map((x) => x.replace(/\.[^/.]+$/, ""));

const createNavFileEntries = (extraFilesArray: string[]) =>
    extraFilesArray
        .map((fileId) => `          - fileId: /api-reference/${fileId}\n          - isHidden: true`)
        .join("\n");

// Take content from base nav file, append extra file entries to it and output to output navigation.yml file
const writeToOutputNavFile = (extraFileNavEntries: string) => {
    const baseNavFileContent = readFileSync(BASE_NAV_FILE_PATH, { encoding: "utf8" });
    const outputNavFilePath = resolve(DOCUMENTATION_DIR_PATH, OUTPUT_NAV_FILE_NAME);
    const outStr = `${baseNavFileContent}${extraFileNavEntries}`;
    writeFileSync(outputNavFilePath, outStr);
};

console.log("Starting navigation.yml generation...");

// Modules are considered non-extra files, all other files are extra. Module filenames don't
// contain any "." (besides the file extension).
const allFiles = getAllApiReferenceFileNames();
const extraFiles = allFiles.filter((x) => x.includes("."));
const moduleFiles = allFiles.filter((x) => !extraFiles.includes(x));

console.log(`Module files found: ${JSON.stringify(moduleFiles, null, "\t")}`);
console.log(`Extra files: ${JSON.stringify(extraFiles, null, "\t")}`);

const navigationFileEntries = createNavFileEntries(extraFiles);
writeToOutputNavFile(navigationFileEntries);

console.log("Successfully generated navigation.yml file");
