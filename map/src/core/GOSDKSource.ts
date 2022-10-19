import { Map, Source, SourceSpecification } from "maplibre-gl";

/**
 * Contains a source relevant for GO SDK JS.
 * * The source might already be initialized from the map style, or it might be initialized here.
 * @ignore
 */
export class GOSDKSource<
    SOURCE_SPEC extends SourceSpecification = SourceSpecification,
    RUNTIME_SOURCE extends Source = Source
> {
    constructor(readonly id: string, readonly spec?: SOURCE_SPEC, public runtimeSource?: RUNTIME_SOURCE) {}

    ensureAddedToMap(map: Map) {
        if (!this.runtimeSource) {
            if (!map.getSource(this.id) && this.spec) {
                map.addSource(this.id, this.spec);
            }
            this.runtimeSource = map.getSource(this.id) as RUNTIME_SOURCE;
        }
    }
}
