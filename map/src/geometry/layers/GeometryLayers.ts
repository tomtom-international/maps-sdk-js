import { FillLayerSpecification, LineLayerSpecification } from "maplibre-gl";
import { LayerSpecTemplate } from "../../core";

const color = "#0A3653";

export const locationGeometryFillSpec: LayerSpecTemplate<FillLayerSpecification> = {
    type: "fill",
    paint: {
        "fill-color": color,
        "fill-opacity": 0.15,
        "fill-antialias": false
    }
};

export const locationGeometryOutlineSpec: LayerSpecTemplate<LineLayerSpecification> = {
    type: "line",
    paint: {
        "line-color": color,
        "line-opacity": 0.45,
        "line-width": 2
    }
};
