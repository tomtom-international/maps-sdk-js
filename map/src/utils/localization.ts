import { Map, SymbolLayerSpecification, ExpressionSpecification } from "maplibre-gl";

export const isLayerLocalizable = (layer: SymbolLayerSpecification) => {
    const textField = (layer.layout?.["text-field"] ?? "") as string | ExpressionSpecification;
    // tries to detect layers which has "text-field" that can be localized
    // ex. "text-field": "{name}" or "text-field": ["get", "name"]
    const toBeLocalized = textField === "{name}" || (textField?.length == 2 && textField?.[1] == "name");
    // tries to detect layers which have "text-field" that was localized already
    // ex. "text-field": ["coalesce", ["get", "name_en-GB"], ["get", "name"]]
    const isTextFieldAlreadyLocalized = Array.isArray(textField?.[2]) && textField?.[2].includes("name");
    return toBeLocalized || isTextFieldAlreadyLocalized;
};
