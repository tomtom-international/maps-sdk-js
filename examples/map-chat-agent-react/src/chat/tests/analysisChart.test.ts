import type { ChartConfiguration } from 'chart.js';
import { describe, expect, it, vi } from 'vitest';
import { isRenderableChart } from '../AnalysisChart';

// The toolkit's entry loads the map bundle and the zoom plugin loads hammerjs, which both need a
// browser; the chart check reads neither.
vi.mock('@tomtom-org/maps-sdk-plugin-agent-toolkit', () => ({ isChartConfiguration: () => true }));
vi.mock('chartjs-plugin-zoom', () => ({ default: { id: 'zoom' } }));

const barChart = (
    datasets: unknown,
    scales?: Record<string, { type?: string; position?: string }>,
): ChartConfiguration =>
    ({ type: 'bar', data: { labels: [], datasets }, options: scales ? { scales } : {} }) as ChartConfiguration;

describe('isRenderableChart', () => {
    it('accepts a chart on registered dataset types and scales', () => {
        expect(isRenderableChart(barChart([{ data: [1] }]))).toBe(true);
        expect(isRenderableChart(barChart([{ type: 'line', data: [1] }], { x: {}, y: { type: 'linear' } }))).toBe(true);
    });

    it('rejects a scale Chart.js would throw on', () => {
        expect(isRenderableChart(barChart([], { y: { type: 'logarithmic' } }))).toBe(false);
        expect(isRenderableChart(barChart([], { x: { type: 'time' } }))).toBe(false);
    });

    it('rejects a scale whose axis Chart.js cannot tell', () => {
        expect(isRenderableChart(barChart([], { delay: { type: 'linear' } }))).toBe(false);
    });

    it('accepts a scale whose axis its id, position or a dataset gives', () => {
        expect(isRenderableChart(barChart([], { yDelay: { type: 'linear' } }))).toBe(true);
        expect(isRenderableChart(barChart([], { delay: { type: 'linear', position: 'right' } }))).toBe(true);
        expect(isRenderableChart(barChart([{ data: [1], yAxisID: 'delay' }], { delay: { type: 'linear' } }))).toBe(
            true,
        );
    });

    it('rejects a dataset type Chart.js would throw on', () => {
        expect(isRenderableChart(barChart([{ type: 'area', data: [1] }]))).toBe(false);
    });

    it('rejects datasets that are not an array of objects', () => {
        expect(isRenderableChart(barChart({}))).toBe(false);
        expect(isRenderableChart(barChart([{ data: [1] }, null]))).toBe(false);
    });
});
