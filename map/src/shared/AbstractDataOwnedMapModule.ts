import { AbstractMapModule } from './AbstractMapModule';
import type { GeoJSONSourcesWithLayers, MapModuleCommonConfig } from './types';

/**
 * Base class for the map modules that add and own their own GeoJSON sources, layers and images:
 * places, routes, geometries, the traffic overlays and bring-your-own-data.
 *
 * @remarks
 * The module owns the data it draws. Its generated IDs therefore carry a per-instance suffix
 * (see `instanceIndex`), and the module is safely multi-instance: every `create(map, config?)`
 * call returns another module with its own sources and layers.
 *
 * Owning the data brings the duty this class states: a clean style switch must forget the data
 * the module remembers having shown, through {@link discardShownData}.
 *
 * @typeParam SOURCES_WITH_LAYERS - The GeoJSON sources, with their layers, this module owns
 * @typeParam CFG - The configuration type for this module, or undefined if no configuration is needed
 *
 * @group Shared
 */
export abstract class AbstractDataOwnedMapModule<
    SOURCES_WITH_LAYERS extends GeoJSONSourcesWithLayers,
    CFG extends MapModuleCommonConfig | undefined = undefined,
> extends AbstractMapModule<SOURCES_WITH_LAYERS, CFG> {
    /**
     * Owning the data it draws, such a module always remembers something a clean style switch must
     * forget, so the inherited no-op becomes a duty here. A module that remembers nothing
     * implements this as a no-op, and says why.
     * @protected
     * @ignore
     */
    protected abstract discardShownData(): void;
}
