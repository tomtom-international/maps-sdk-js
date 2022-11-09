import { AbstractMapModule } from "../core";
import { isLayerLocalizable } from "../utils/localization";
import { MapLanguageConfig } from "./types/MapLanguageConfig";
import { GOSDKMap } from "../GOSDKMap";

/**
 * @group Language
 * @category Functions
 */
export class MapLanguage extends AbstractMapModule<MapLanguageConfig> {
    static mapLanguageInstance: MapLanguage | null = null;
    private constructor(goSDKMap: GOSDKMap, config: MapLanguageConfig) {
        super(goSDKMap, config);
    }

    public static localizeMapWhenReady(goSDKMap: GOSDKMap, config: MapLanguageConfig): void {
        if (!MapLanguage.mapLanguageInstance) {
            MapLanguage.mapLanguageInstance = new MapLanguage(goSDKMap, config);
            return;
        }
        MapLanguage.mapLanguageInstance.localizeMap(config.language);
    }

    protected init(config: MapLanguageConfig): void {
        this.localizeMap(config.language);
    }

    localizeMap(language: string) {
        const mapStyle = this.mapLibreMap.getStyle();
        mapStyle.layers.forEach((layer) => {
            if (layer.type == "symbol" && isLayerLocalizable(layer)) {
                const textFieldValue = language
                    ? ["coalesce", ["get", `name_${language}`], ["get", "name"]]
                    : ["get", "name"];
                this.mapLibreMap.setLayoutProperty(layer.id, "text-field", textFieldValue);
            }
        });
    }
}
