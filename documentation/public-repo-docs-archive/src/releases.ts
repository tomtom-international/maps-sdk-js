import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { PUBLIC_REPOSITORY_URL } from './siteUrls.ts';
import { byVersionDescending, releaseTagPattern } from './versions.ts';

/** One SDK release, from its archive tag `v<version>`. */
export type Release = {
    version: string;
    tag: string;
    /** The day of the docs, as `YYYY-MM-DD`. */
    date: string;
    /** The release tags of the plugins whose docs the tag holds. */
    pluginTags: string[];
    /** The tag's `docs/` folder on GitHub, for a version off the site. */
    githubTreeUrl: string;
};

export const PLUGIN_TAG_PREFIX = '@tomtom-org/maps-sdk-plugin-';

/** The archive tags `v<version>` of the repository at `gitDirectory`, newest first. */
export const readReleases = (gitDirectory: string): Release[] =>
    runGit(gitDirectory, 'tag', '-l', 'v*')
        .toString()
        .split('\n')
        .filter((tag) => releaseTagPattern.test(tag))
        .map((tag) => tag.slice('v'.length))
        .sort(byVersionDescending)
        .map((version) => {
            const tag = `v${version}`;
            const [date, ...sourceTags] = runGit(gitDirectory, 'log', '-1', '--format=%cs%n%b', tag)
                .toString()
                .trim()
                .split('\n');
            const pluginTags = sourceTags.filter((sourceTag) => sourceTag.startsWith(PLUGIN_TAG_PREFIX));
            return { version, tag, date, pluginTags, githubTreeUrl: `${PUBLIC_REPOSITORY_URL}/tree/${tag}/docs` };
        });

/** Writes the `docs/` folder of `tag` into `directory`. */
export const extractDocs = (gitDirectory: string, tag: string, directory: string) => {
    fs.mkdirSync(directory, { recursive: true });
    execFileSync('tar', ['-x', '-C', directory], { input: runGit(gitDirectory, 'archive', `${tag}:docs`) });
};

const runGit = (gitDirectory: string, ...gitArguments: string[]): Buffer =>
    execFileSync('git', ['-C', gitDirectory, ...gitArguments], { maxBuffer: 1 << 30 });
