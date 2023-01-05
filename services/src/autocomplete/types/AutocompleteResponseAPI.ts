import { AutocompleteContext, AutocompleteResultGeoBias, AutocompleteResult } from "./AutocompleteResponse";
import { LatLonAPI } from "../../shared";

/**
 * @group Autocomplete
 * @category Types
 */
export type AutocompleteResponseAPI = {
    context: AutocompleteContextAPI;
    results: AutocompleteResult[];
};

export type AutocompleteContextAPI = Omit<AutocompleteContext, "geoBias"> & {
    geoBias?: AutocompleteResultGeoBiasAPI;
};

export type AutocompleteResultGeoBiasAPI = Omit<AutocompleteResultGeoBias, "position"> & {
    position?: LatLonAPI;
};
