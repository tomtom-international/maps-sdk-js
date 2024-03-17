import type { ExpressionSpecification, SymbolLayerSpecification } from "maplibre-gl";

/**
 * @ignore
 */
export const isLayerLocalizable = (layer: SymbolLayerSpecification): boolean => {
    const textField = (layer.layout?.["text-field"] ?? "") as string | ExpressionSpecification;
    return textField
        ? // tries to detect layers which have a "text-field" that can be localized
          // ex. "text-field": "{name}" or "text-field": ["get", "name"]
          textField === "{name}" ||
              (textField.length == 2 && textField[1] == "name") ||
              // tries to detect layers which have "text-field" that was localized already
              // ex. "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]]
              (textField.length == 3 &&
                  Array.isArray(textField[1]) &&
                  typeof textField[1][1] == "string" &&
                  textField[1][1].includes("name_") &&
                  Array.isArray(textField[2]) &&
                  textField[2].includes("name"))
        : false;
};
