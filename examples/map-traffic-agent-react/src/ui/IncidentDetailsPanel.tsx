import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';
import { formatDelay } from '../utils/format';
import { KpiTile, NoteBanner, PanelCard } from './components';
import { playbook } from './lib/playbook-tokens';
import { severityColor, severityLabel } from './lib/severity';

function formatTime(date: Date | undefined): string | null {
    if (!date) return null;
    return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export type IncidentDetailsPanelProps = {
    incident: TrafficIncident;
    overlapCount: number;
    onClose: () => void;
};

const LABEL_CLASS = 'text-[11px] font-semibold uppercase tracking-wide';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5">
            <div className={LABEL_CLASS} style={{ color: playbook.text.lowEm, fontFamily: playbook.font.body }}>
                {label}
            </div>
            {children}
        </div>
    );
}

/**
 * The Figma "Jam" details card: a titled overlay (category + close) over From/To endpoints, a 2-column
 * grid of metric tiles — Severity + Delay in their emphasis colours, Length + Probability neutral — and
 * label/value fields for the timing, road, events, and incident id.
 */
export function IncidentDetailsPanel({ incident, overlapCount, onClose }: IncidentDetailsPanelProps) {
    const props = incident.properties;
    const delay = props.delayInSeconds != null ? formatDelay(props.delayInSeconds) : null;
    const start = formatTime(props.startTime);
    const end = formatTime(props.endTime);
    const magnitudeColor = severityColor(props.magnitudeOfDelay);
    const magnitudeLabel = severityLabel(props.magnitudeOfDelay);
    const lengthLabel =
        props.lengthInMeters === undefined
            ? null
            : props.lengthInMeters >= 1000
              ? `${(props.lengthInMeters / 1000).toFixed(1)} km`
              : `${Math.round(props.lengthInMeters)} m`;

    return (
        <PanelCard
            aria-label={`Incident details: ${props.category}`}
            title={<span className="capitalize">{props.category}</span>}
            onClose={onClose}
            className="w-[340px] max-w-full max-h-[80vh] overflow-auto"
        >
            <div className="flex flex-col gap-3 px-3 pt-2 pb-3" style={{ color: playbook.text.highEm }}>
                {(props.from || props.to) && (
                    <div className="flex flex-col gap-0.5 text-[14px]">
                        {props.from && <div>From {props.from}</div>}
                        {props.to && <div>To {props.to}</div>}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                    <KpiTile label="Severity" value={magnitudeLabel} accent={magnitudeColor} labelTop />
                    {delay && <KpiTile label="Delay" value={delay} tone="error" labelTop />}
                    {lengthLabel && <KpiTile label="Length" value={lengthLabel} labelTop />}
                    {props.probabilityOfOccurrence && (
                        <KpiTile
                            label="Probability"
                            value={<span className="capitalize">{props.probabilityOfOccurrence}</span>}
                            labelTop
                        />
                    )}
                </div>

                {(start || end) && (
                    <Field label="When">
                        {start && (
                            <div className="text-[12px]" style={{ color: playbook.text.medEm }}>
                                Start: {start}
                            </div>
                        )}
                        {end && (
                            <div className="text-[12px]" style={{ color: playbook.text.medEm }}>
                                End: {end}
                            </div>
                        )}
                    </Field>
                )}

                {props.events.length > 0 && (
                    <Field label="Events">
                        <ul className="m-0 list-disc pl-3">
                            {props.events.map((event) => (
                                <li key={event.code} className="text-[12px]" style={{ color: playbook.text.medEm }}>
                                    {event.description}
                                </li>
                            ))}
                        </ul>
                    </Field>
                )}

                {props.roadNumbers && props.roadNumbers.length > 0 && (
                    <Field label="Road">
                        <div className="text-[14px] font-semibold">{props.roadNumbers.join(', ')}</div>
                    </Field>
                )}

                {overlapCount > 1 && (
                    <NoteBanner>
                        {overlapCount - 1} other incident{overlapCount - 1 === 1 ? '' : 's'} at this location
                    </NoteBanner>
                )}

                <Field label="Incident ID">
                    <code
                        className="block break-all text-[12px] select-all"
                        style={{ color: playbook.text.medEm, fontFamily: playbook.font.code }}
                        title={props.id}
                    >
                        {props.id}
                    </code>
                </Field>
            </div>
        </PanelCard>
    );
}
