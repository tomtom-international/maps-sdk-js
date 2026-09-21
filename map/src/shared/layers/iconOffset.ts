import type { DataDrivenPropertyValueSpecification } from 'maplibre-gl';
import type { CustomImage } from '../types/image';
import { ICON_ID } from './symbolLayers';

/**
 * Pixel offset of an icon from its anchor point.
 * @ignore
 */
export type IconOffset = { x: number; y: number };

/**
 * Collects the non-zero pixel offsets from a list of custom images, keyed by icon ID.
 *
 * Entries without an `image` are skipped: they reference an existing sprite icon by ID,
 * which the module never registers and therefore cannot reposition.
 * @ignore
 */
export const buildCustomIconOffsets = (icons: CustomImage[] = []): Map<string, IconOffset> => {
    const iconOffsets = new Map<string, IconOffset>();

    for (const icon of icons) {
        if (!icon.image) {
            continue;
        }

        const offset = { x: icon.offsetX ?? 0, y: icon.offsetY ?? 0 };
        if (offset.x === 0 && offset.y === 0) {
            continue;
        }

        iconOffsets.set(icon.id, offset);
    }

    return iconOffsets;
};

/**
 * Builds a data-driven `icon-offset` expression from icon ID / offset pairs, matched against
 * the feature's `iconID`. Icons absent from the pairs, or present with a zero offset, fall
 * back to `[0, 0]` (no offset). Returns `undefined` when no icon needs an offset, so callers
 * can leave `icon-offset` off the layout entirely.
 *
 * Takes the pairs rather than a record shape so a caller that stores offsets alongside other
 * per-icon data can hand over just the offsets.
 * @ignore
 */
export const buildIconOffsetExpression = (
    iconOffsets: Iterable<readonly [string, IconOffset]>,
): DataDrivenPropertyValueSpecification<[number, number]> | undefined => {
    const offsetCaseExpression: unknown[] = ['case'];
    for (const [iconId, offset] of iconOffsets) {
        if (offset.x === 0 && offset.y === 0) {
            continue;
        }
        offsetCaseExpression.push(['==', ['get', ICON_ID], iconId], ['literal', [offset.x, offset.y]]);
    }

    if (offsetCaseExpression.length === 1) {
        return undefined;
    }

    offsetCaseExpression.push(['literal', [0, 0]]);
    return offsetCaseExpression as DataDrivenPropertyValueSpecification<[number, number]>;
};
