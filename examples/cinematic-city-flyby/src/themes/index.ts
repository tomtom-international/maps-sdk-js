import { filmThemes } from './film';
import { naturalThemes } from './natural';
import { nightThemes } from './night';
import { printThemes } from './print';

export type { FlybyTheme } from './theme';

/** The looks, most natural first: the order the Theme menu lists them in. */
export const flybyThemes = [...naturalThemes, ...filmThemes, ...printThemes, ...nightThemes];

/** The name of each look, which a fly-by picks its own by. */
export type FlybyLook = (typeof flybyThemes)[number]['label'];
