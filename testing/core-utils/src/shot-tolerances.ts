/** How much of a shot may differ, and how far a pixel's colour may move before it counts, as Playwright takes it. */
export type ShotTolerance = { maxDiffPixelRatio: number; threshold?: number };

/**
 * How much of a shot over live tiles may differ, at the pinned style version.
 *
 * @remarks
 * Room for the tiles to drift — a rebuilt block or a realigned street is a few thousand pixels, a
 * fraction of the 4% granted — while what these shots are written for moves 8% or more. Each pixel
 * is held to a tenth of Playwright's default colour threshold, which lets a shade move 4% in
 * lightness unseen.
 */
export const LIVE_MAP_TOLERANCE: ShotTolerance = { maxDiffPixelRatio: 0.04, threshold: 0.02 };
