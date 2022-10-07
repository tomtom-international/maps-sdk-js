import { Map, Source, SourceSpecification } from "maplibre-gl";

/**
 * Contains a source relevant for GO SDK JS.
 * * The source might already be initialized from the map style, or it might be initialized here.
 * @ignore
 */
export class GOSDKSource<S extends Source = Source> {
    readonly id: string;
    readonly spec: SourceSpecification | null;
    public runtimeSource: S | undefined;

    constructor(id: string, spec: SourceSpecification | null, runtimeSource?: S) {
        this.id = id;
        this.spec = spec;
        this.runtimeSource = runtimeSource;
    }

    public ensureAddedToMap = (map: Map) => {
        if (!map.getSource(this.id) && this.spec) {
            map.addSource(this.id, this.spec);
        }
        this.runtimeSource = map.getSource(this.id) as S;
    };
}

/**
 * @ignore
 * @param id
 * @param spec
 */
export const goSDKSourceFromSpec = (id: string, spec: SourceSpecification): GOSDKSource => new GOSDKSource(id, spec);

/**
 * @ignore
 * @param runtimeSource
 */
export const goSDKSourceFromRuntime = <S extends Source = Source>(runtimeSource: S): GOSDKSource =>
    new GOSDKSource(runtimeSource.id, null, runtimeSource);
