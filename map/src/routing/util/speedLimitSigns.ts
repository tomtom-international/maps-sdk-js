import {
    type CountrySectionProps,
    type DisplayUnits,
    type DistanceUnitsType,
    MILE_IN_METERS,
    type SpeedLimitSectionProps,
} from '@tomtom-org/maps-sdk/core';
import { suffixNumber } from '../../shared/layers/utils';
import type { DisplayRouteProps } from '../types/displayRoutes';
import type { SectionSignUnit } from '../types/routeModuleConfig';
import type { DisplaySpeedLimitSectionProps, SpeedLimitSignFace } from '../types/routeSections';

/** The step a limit is posted in, so a converted number lands on one a sign can show. */
const MPH_STEP = 5;

/** The colour a number is printed in where it is not near-black. */
const BLUE_NUMERALS = '#0B5FA5';

/** The near-black every other country prints its numbers in. */
const DEFAULT_NUMERALS = '#1A2024';

/**
 * How one place posts a speed limit, as far as it differs from the white disc reading km/h in
 * near-black. Every field left out falls back to that.
 */
type SignConvention = { face?: SpeedLimitSignFace; unit?: SectionSignUnit; numerals?: string };

// What each country posts, by ISO 3166-1 alpha-3 code. A country missing here posts the default.
const SIGN_BY_COUNTRY: Record<string, SignConvention> = {
    // The country a sign stands in decides its unit: a route through Kent shown to an app
    // configured in kilometres still passes signs reading mph.
    GBR: { unit: 'mph' },
    LBR: { unit: 'mph' },
    MMR: { unit: 'mph' },
    USA: { face: 'plaque', unit: 'mph' },
    // The Nordic yellow disc, so a sign there does not read as a Dutch one.
    SWE: { face: 'yellowDisc' },
    FIN: { face: 'yellowDisc' },
    ISL: { face: 'yellowDisc' },
    // Japan posts the same disc, in blue.
    JPN: { numerals: BLUE_NUMERALS },
};

// With no country to go on, the units the app displays in are the best answer available: a US app
// gets the plaque it would see on the road, and any other imperial reader gets the disc in mph.
const SIGN_BY_DISPLAY_UNITS: Record<DistanceUnitsType, SignConvention> = {
    metric: {},
    imperial_uk: { unit: 'mph' },
    imperial_us: { face: 'plaque', unit: 'mph' },
};

/**
 * The image each sign face is drawn from, before any instance suffix.
 *
 * @remarks
 * The one list of the faces there are: the module adds an image per entry, the SVG table in
 * `routing/resources` is keyed by the same names, and a section names its face here. Adding a face
 * to {@link SpeedLimitSignFace} fails to compile until all three carry it.
 * @ignore
 */
export const SPEED_LIMIT_IMAGE_ID_BY_FACE: Record<SpeedLimitSignFace, string> = {
    whiteDisc: 'routeSpeedLimitWhiteDisc',
    yellowDisc: 'routeSpeedLimitYellowDisc',
    plaque: 'routeSpeedLimitPlaque',
};

/**
 * The country a point of the route lies in, or `undefined` when the route was not asked for its
 * country sections. They tile a route end to end, so the one holding a point is its country.
 */
const countryAt = (pointIndex: number, countrySections?: CountrySectionProps[]): string | undefined =>
    countrySections?.find((country) => pointIndex >= country.startPointIndex && pointIndex <= country.endPointIndex)
        ?.countryCodeISO3;

/** The number a sign shows: converted for its unit, and rounded to the step limits are posted in. */
const postedSpeedLimit = (maxSpeedLimitInKmh: number, unit: SectionSignUnit): number =>
    unit === 'mph'
        ? Math.round((maxSpeedLimitInKmh * 1000) / MILE_IN_METERS / MPH_STEP) * MPH_STEP
        : maxSpeedLimitInKmh;

/**
 * Turns each speed limit section into the sign that posts it: the face to draw it on, the colour of
 * its numerals, and the number to print.
 *
 * @remarks
 * A section carries only `maxSpeedLimitInKmh`, so everything that varies comes from the country the
 * stretch runs through — read off the route's own `country` sections — and from the display units
 * where the route carries none. An explicit `unit` on the knob wins over both, for an app posting
 * one unit everywhere.
 * @ignore
 */
export const toDisplaySpeedLimitSectionProps =
    (instanceIndex: number, options?: { unit?: SectionSignUnit; displayUnits?: DisplayUnits }) =>
    (
        sectionProps: SpeedLimitSectionProps,
        routeProps?: DisplayRouteProps,
    ): Omit<DisplaySpeedLimitSectionProps, 'routeState' | 'routeIndex'> => {
        const country = countryAt(sectionProps.startPointIndex, routeProps?.sections.country);
        const convention = country
            ? (SIGN_BY_COUNTRY[country] ?? {})
            : SIGN_BY_DISPLAY_UNITS[options?.displayUnits?.distance?.type ?? 'metric'];
        const face = convention.face ?? 'whiteDisc';
        const unit = options?.unit ?? convention.unit ?? 'km/h';

        return {
            ...sectionProps,
            signImageID: suffixNumber(SPEED_LIMIT_IMAGE_ID_BY_FACE[face], instanceIndex),
            signLabel: String(postedSpeedLimit(sectionProps.maxSpeedLimitInKmh, unit)),
            // The layer offsets the number by face: a plaque prints its own words where a disc is
            // empty, so the number cannot sit in the same place on both.
            signFace: face,
            signNumeralsColor: convention.numerals ?? DEFAULT_NUMERALS,
        };
    };
