export const buildExcludeIconFilterExpression = (icon: number) => ["!=", ["get", "icon"], icon];
export const buildExcludeIconArrayFilterExpression = (icons: number[]) => {
    const expression: any = ["all"];
    icons?.forEach((icon) => expression.push(buildExcludeIconFilterExpression(icon)));
    return expression;
};

export const buildIncludeIconFilterExpression = (icon: number) => ["==", ["get", "icon"], icon];
export const buildIncludeIconArrayFilterExpression = (icons: number[]) => {
    const expression: any = ["any"];
    icons?.forEach((icon) => expression.push(buildIncludeIconFilterExpression(icon)));
    return expression;
};
