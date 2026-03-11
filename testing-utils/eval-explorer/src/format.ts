export const formatPercent = (value: number): string => `${(value * 100).toFixed(1)}%`;

export const formatDeltaPercent = (value: number): string => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${(value * 100).toFixed(1)} pts`;
};

export const formatInteger = (value: number): string =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);

export const formatDecimal = (value: number): string =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);

export const formatDuration = (value: number): string => {
    if (value >= 1000) {
        return `${formatDecimal(value / 1000)} s`;
    }
    return `${formatInteger(value)} ms`;
};

export const formatSignedNumber = (value: number): string => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${formatDecimal(value)}`;
};
