import { AbstractMapModule } from "../core";
import { isLayerLocalizable } from "../utils/localization";
import { MapLanguageConfig } from "./types/MapLanguageConfig";
import { GOSDKMap } from "../GOSDKMap";

/**
 * @group Language
 * @category Functions
 */
export class MapLanguage extends AbstractMapModule<MapLanguageConfig> {
    static instance: MapLanguage;
    private constructor(goSDKMap: GOSDKMap, config: MapLanguageConfig) {
        super(goSDKMap, config);
    }

    static setLanguageWhenMapReady(goSDKMap: GOSDKMap, config: MapLanguageConfig): void {
        if (!MapLanguage.instance) {
            MapLanguage.instance = new MapLanguage(goSDKMap, config);
            return;
        }
        MapLanguage.instance.callWhenMapReady(() => MapLanguage.instance.setLanguage(config.language));
    }

    protected init(config: MapLanguageConfig): void {
        this.setLanguage(config.language);
    }

    setLanguage(language: string) {
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
