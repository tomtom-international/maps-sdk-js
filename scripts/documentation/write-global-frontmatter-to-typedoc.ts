import typedocConfig from "../../typedoc.json";
import { version } from "../../package.json";
import { writeFileSync } from "fs";
import { resolve } from "path";

const updatedTypedocConfig = {
    ...typedocConfig,
    frontmatterGlobals: {
        titleTags: [
            {
                label: `Version ${version}`,
                color: "grey5"
            }
        ]
    }
};

const outputDir = resolve(__dirname, "../../typedoc.json");
writeFileSync(outputDir, JSON.stringify(updatedTypedocConfig, null, "  "));
console.log(`Successfully wrote global frontmatter to Typedoc config at ${outputDir}`);
