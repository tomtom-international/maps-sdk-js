/**
 * Dynamically generate a navigation.yml file for the generated documentation.
 *
 * Creates navigation.yml file entries for all the extra generated documentation files, i.e. files that aren't part
 * of the navigation side-menu in devportal, but should still be accessible. These entries are appended to the contents
 * of base-navigation.yml and written to a navigation.yml file.
 */

import { readdirSync, statSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const DOCUMENTATION_DIR_PATH = resolve(__dirname, "../documentation/dev-portal/javascript/maps/documentation/");
const API_REFERENCE_DIR_PATH = resolve(DOCUMENTATION_DIR_PATH, "api-reference");
const MODULES_DIR_NAME = "modules";
const INTERNAL_MODULE_SUFFIX = ".internal";
const BASE_NAV_FILE_NAME = "base-navigation.yml";
const OUTPUT_NAV_FILE_NAME = "navigation.yml";

// All the files except the non-internal module files are "extra"
const getAllExtraFiles = () => {
    const allDirsInApiRefDir = readdirSync(API_REFERENCE_DIR_PATH)
        .map((dirEntry) => {
            const path = resolve(API_REFERENCE_DIR_PATH, dirEntry);
            if (statSync(path).isDirectory()) {
                return dirEntry;
            }
        })
        .filter((item) => item !== undefined) as string[];

    const allExtraFiles: string[] = [];
    allDirsInApiRefDir.forEach((dirName) => {
        const path = resolve(API_REFERENCE_DIR_PATH, dirName);
        readdirSync(path).forEach((file) => {
            const fileWithoutExtension = file.replace(/\.[^/.]+$/, "");
            // The only "extra" files in the modules dir are internal module files
            if (dirName === MODULES_DIR_NAME && !fileWithoutExtension.endsWith(INTERNAL_MODULE_SUFFIX)) return;
            allExtraFiles.push(`/api-reference/${dirName}/${fileWithoutExtension}`);
        });
    });
    return allExtraFiles;
};

const createNavFileEntries = (extraFilesArray: string[]) =>
    extraFilesArray.map((fileId) => `          - fileId: ${fileId}\n          - isHidden: true`).join("\n");

// Take content from base nav file, append extra file entries to it and output to output nav file
const writeToOutputNavFile = (extraFileNavEntries: string) => {
    const baseNavFilePath = resolve(DOCUMENTATION_DIR_PATH, BASE_NAV_FILE_NAME);
    const outputNavFilePath = resolve(DOCUMENTATION_DIR_PATH, OUTPUT_NAV_FILE_NAME);

    const baseNavFileContent = readFileSync(baseNavFilePath, { encoding: "utf8" });
    const outStr = `${baseNavFileContent}${extraFileNavEntries}`;
    writeFileSync(outputNavFilePath, outStr);
};

const extraFiles = getAllExtraFiles();
const navEntryString = createNavFileEntries(extraFiles);
writeToOutputNavFile(navEntryString);
