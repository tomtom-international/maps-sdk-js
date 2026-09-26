import { AbstractMapModule } from './AbstractMapModule';
import type { MapModuleCommonConfig, StyleSourcesWithLayers } from './types';

/**
 * Base class for the map modules that control sources and layers the loaded map style already
 * provides, under fixed global IDs: the base map, POIs, the traffic tiles and the terrain.
 *
 * @remarks
 * The style owns the data, so such a module brings no data of its own and shows nothing by
 * itself. It changes how the parts the style provides are drawn, filtered and made visible.
 * The SDK memoizes one instance per map, obtained with `get(map, config?)`, so every handle on it
 * sees the same state.
 *
 * Because those sources and layers arrive with the style, they are in place as soon as the new
 * style is loaded, and the module re-binds to them in the same tick. That is what the base class
 * already does, so this class adds no behaviour: it names the kind, and it narrows the sources a
 * module of this kind can hold.
 *
 * @typeParam SOURCES_WITH_LAYERS - The style sources, with their layers, this module controls
 * @typeParam CFG - The configuration type for this module, or undefined if no configuration is needed
 *
 * @group Shared
 */
export abstract class AbstractStyleOwnedMapModule<
    SOURCES_WITH_LAYERS extends StyleSourcesWithLayers,
    CFG extends MapModuleCommonConfig | undefined = undefined,
> extends AbstractMapModule<SOURCES_WITH_LAYERS, CFG> {}
