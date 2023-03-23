import { DataDrivenPropertyValueSpecification } from "maplibre-gl";
import { ColorPaletteOptions } from "../layers/GeometryLayers";

type GeometryColorConfig = {
    fillColor?: ColorPaletteOptions | DataDrivenPropertyValueSpecification<string>;
    fillOpacity?: DataDrivenPropertyValueSpecification<number>;
};

type GeometryTextConfig = {
    textField: DataDrivenPropertyValueSpecification<string>;
};

type GeometryLineConfig = {
    lineColor?: DataDrivenPropertyValueSpecification<string>;
    lineOpacity?: DataDrivenPropertyValueSpecification<number>;
    lineWidth?: DataDrivenPropertyValueSpecification<number>;
};

export type GeometryModuleConfig = {
    colorConfig?: GeometryColorConfig;
    textConfig?: GeometryTextConfig;
    lineConfig?: GeometryLineConfig;
};
