import { ExpressionSpecification } from "maplibre-gl";

export const buildExcludeIconFilterExpression = (icon: number): ExpressionSpecification => [
    "!=",
    ["get", "icon"],
    icon
];
export const buildExcludeIconArrayFilterExpression = (icons: number[]) => {
    const expression: ExpressionSpecification = ["all"];
    icons?.forEach((icon) => expression.push(buildExcludeIconFilterExpression(icon)));
    return expression;
};

export const buildIncludeIconFilterExpression = (icon: number): ExpressionSpecification => [
    "==",
    ["get", "icon"],
    icon
];
export const buildIncludeIconArrayFilterExpression = (icons: number[]) => {
    const expression: ExpressionSpecification = ["any"];
    icons?.forEach((icon) => expression.push(buildIncludeIconFilterExpression(icon)));
    return expression;
};
