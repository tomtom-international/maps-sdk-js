export const layers = [
    [
        "Default text-field string",
        {
            type: "symbol",
            id: "symbolLayer1",
            source: "a",
            layout: {
                "text-field": "{name}"
            }
        },
        true
    ],
    ["Line layer", { type: "line", id: "lineLayer", source: "source" }, false],
    [
        "Default text-field expression",
        { type: "symbol", id: "symbolLayer2", source: "source", layout: { "text-field": ["get", "name"] } },
        true
    ],
    [
        "Symbol layer with already localized text-field",
        {
            type: "symbol",
            id: "symbolLayer3",
            source: "source",
            layout: { "text-field": ["coalesce", ["get", "name_en-GB"], ["get", "name"]] }
        },
        true
    ],
    [
        "Symbol layer with unrecognized text-field",
        { type: "symbol", id: "symbolLayer4", source: "source", layout: { "text-field": "{text}" } },
        false
    ],
    ["Hillshade layer", { type: "hillshade", id: "hillshadeLayer", source: "a" }, false],
    ["Background layer", { type: "background", id: "backgroundLayer", layout: {} }, false],
    [
        "Symbol layer with different localized text-field",
        {
            type: "symbol",
            id: "symbolLayer5",
            source: "source",
            layout: { "text-field": ["coalesce", ["get", "name_ar"], ["get", "name"]] }
        },
        true
    ]
];
