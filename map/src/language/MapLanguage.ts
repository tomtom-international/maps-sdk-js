import { AbstractMapModule } from "../core";
import { localizeMap } from "../utils/localization";

type MapLanguageConfig = {
    language: string;
};
/**
 * @group Language
 * @category Functions
 */
export class MapLanguage extends AbstractMapModule<MapLanguageConfig> {
    protected init(config: MapLanguageConfig): void {
        localizeMap(this.mapLibreMap, config.language);
    }
}
