import type { ToolEntry } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { z } from 'zod';
import { publishReport } from '../panels/report-store';
import { buildReportHtml, hasResults } from '../report/report-html';

// Assemble a customer-ready HTML report from the RESULTS STORE — every figure is read straight from
// what the analysis tools produced (no agent transcription → no drift). The agent's job is to have
// RUN the analyses the user wants (using clarifyIntent to pin down scope) BEFORE calling this; this
// tool just formats whatever is in the store and hands it to the Report panel.

const generateSiteReportSchema = z.object({
    title: z.string().default('Site Selection Report').describe('Report title.'),
    concept: z.string().optional().describe('What is being sited, e.g. "coffee shop" — shown in the header.'),
    area: z.string().optional().describe('The market/area studied, e.g. "Amsterdam" — shown in the header.'),
});

type GenerateSiteReportInput = z.infer<typeof generateSiteReportSchema>;

export const generateSiteReport: ToolEntry = {
    description:
        'Assemble the analyses run this session (profile / ranking / cannibalization / whitespace) into a styled, ' +
        'customer-ready HTML report — opened in a new tab and downloadable from the Report panel, with a fixed ' +
        'methodology and a mandatory "Not measured" section. Reads results directly (no transcription). Call only ' +
        'AFTER the relevant analyses have run; if the user is vague about scope, use clarifyIntent first, then run ' +
        'the needed tools, then call this.',
    classificationPrompt:
        'Produce / write / export a report or brief of the site-selection analysis done this session.',
    inputSchema: generateSiteReportSchema,
    execute: (async (params: GenerateSiteReportInput) => {
        try {
            if (!hasResults()) {
                return {
                    error: 'No analyses to report yet — run a profile, ranking, comparison, or whitespace scan first.',
                };
            }
            const date = new Date().toISOString().slice(0, 10);
            const html = buildReportHtml({ title: params.title, concept: params.concept, area: params.area, date });
            publishReport({ title: params.title, html });
            return {
                ok: true as const,
                panel: 'Report',
                headline: `"${params.title}" is ready — open or download it from the Report panel.`,
                hint: 'Tell the user the report is ready in the Report panel (Open / Download). Do NOT restate its contents in chat.',
            };
        } catch (error) {
            return { error: `Report generation failed: ${error instanceof Error ? error.message : String(error)}` };
        }
    }) as ToolEntry['execute'],
    examplePrompts: [
        'Write me a site report of everything we analyzed',
        'Generate the brief for these findings',
        'Put together a client-ready report of the shortlist and cannibalization check',
        'Compile the analysis so far into a downloadable report',
    ],
};
