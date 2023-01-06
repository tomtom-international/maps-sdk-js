import { AbstractMapModule, EventsModule, EventsProxy } from "../core";
import { isLayerLocalizable } from "./localization";
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

    static setLanguage(goSDKMap: GOSDKMap, config: MapLanguageConfig): void {
        if (!MapLanguage.instance) {
            MapLanguage.instance = new MapLanguage(goSDKMap, config);
            return;
        } else {
            MapLanguage.instance.setLanguage(config.language);
        }
    }

    protected init(config: MapLanguageConfig): void {
        this.setLanguage(config.language);
    }

    // No implementation needed for MapLanguage module
    protected loadLayersToEventProxy(): void {
        return;
    }

    setLanguage(language: string) {
        this.callWhenMapReady(() => {
            this.mapLibreMap.getStyle().layers.forEach((layer) => {
                if (layer.type == "symbol" && isLayerLocalizable(layer)) {
                    const textFieldValue = language
                        ? ["coalesce", ["get", `name_${language}`], ["get", "name"]]
                        : ["get", "name"];
                    this.mapLibreMap.setLayoutProperty(layer.id, "text-field", textFieldValue);
                }
            });
        });
    }

    get events() {
        return new EventsModule(this.goSDKMap._eventsProxy);
    }
}
