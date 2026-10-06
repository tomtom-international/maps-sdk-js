import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';
import { formatDelay } from '../utils/format';
import { KpiTile, PanelCard } from './components';
import { playbook } from './lib/playbook-tokens';
import { severityColor, severityLabel, severityTile } from './lib/severity';

const PagerButton = ({ dir, onClick, disabled }: { dir: 'left' | 'right'; onClick: () => void; disabled: boolean }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={dir === 'left' ? 'Previous incident' : 'Next incident'}
        className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-(--ui-surface-1) disabled:cursor-not-allowed disabled:opacity-40"
        style={{
            border: `1px solid ${playbook.border.lowEm}`,
            background: playbook.surface.surface0,
            color: playbook.text.highEm,
        }}
    >
        <svg
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
        >
            <path
                d={dir === 'left' ? 'M13 8H3M7 4L3 8l4 4' : 'M3 8h10M9 4l4 4-4 4'}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    </button>
);

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
    /** 0-based position in the clicked overlap stack, and its size — drive the footer pager. */
    index: number;
    total: number;
    onPrev: () => void;
    onNext: () => void;
    onClose: () => void;
};

/** A grey caption over its value ("Stacked labels" in the design). */
function StackedField({
    label,
    children,
    className = '',
}: {
    label: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            <div
                className="text-[14px] leading-5 font-bold"
                style={{ color: playbook.text.lowEm, fontFamily: playbook.font.headings }}
            >
                {label}
            </div>
            {children}
        </div>
    );
}

/**
 * The Figma "Jam details" card: From/To endpoints, a grid of metric tiles, a grouped band of
 * timing/road/id/events, and a footer pager stepping through the overlapping incidents at the click.
 */
export function IncidentDetailsPanel({ incident, index, total, onPrev, onNext, onClose }: IncidentDetailsPanelProps) {
    const props = incident.properties;
    const delay = props.delayInSeconds != null ? formatDelay(props.delayInSeconds) : null;
    const start = formatTime(props.startTime);
    const end = formatTime(props.endTime);
    const magnitudeColor = severityColor(props.magnitudeOfDelay);
    const magnitudeLabel = severityLabel(props.magnitudeOfDelay);
    const magnitudeSwatch = severityTile(props.magnitudeOfDelay);
    const lengthLabel =
        props.lengthInMeters === undefined
            ? null
            : props.lengthInMeters >= 1000
              ? `${(props.lengthInMeters / 1000).toFixed(1)} km`
              : `${Math.round(props.lengthInMeters)} m`;
    const showPager = total > 1;

    const valueClass = 'text-[14px] leading-5 font-bold';

    return (
        <PanelCard
            aria-label={`Incident details: ${props.category}`}
            title={<span className="capitalize">{props.category}</span>}
            onClose={onClose}
            className="w-[340px] max-w-full max-h-[80vh] overflow-auto"
        >
            <div className="flex flex-col" style={{ color: playbook.text.highEm }}>
                <div className="flex flex-col gap-3 px-3 pt-3 pb-3">
                    {(props.from || props.to) && (
                        <div className="flex flex-col gap-3">
                            {(
                                [
                                    ['From', props.from],
                                    ['To', props.to],
                                ] as const
                            ).map(([label, value]) =>
                                value ? (
                                    <StackedField key={label} label={label}>
                                        <div
                                            className="text-[16px] leading-6 font-bold"
                                            style={{ fontFamily: playbook.font.body }}
                                        >
                                            {value}
                                        </div>
                                    </StackedField>
                                ) : null,
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        <KpiTile
                            label="Severity"
                            value={magnitudeLabel}
                            accent={magnitudeColor}
                            swatch={magnitudeSwatch}
                        />
                        {delay && <KpiTile label="Delay" value={delay} tone="error" />}
                        {lengthLabel && <KpiTile label="Length" value={lengthLabel} />}
                        {props.probabilityOfOccurrence && (
                            <KpiTile
                                label="Probability"
                                value={<span className="capitalize">{props.probabilityOfOccurrence}</span>}
                            />
                        )}
                    </div>
                </div>

                <div
                    className="flex flex-col gap-3 px-3 py-3"
                    style={{ background: playbook.surface.surface1, fontFamily: playbook.font.headings }}
                >
                    {(start || end) && (
                        <div className="flex gap-2">
                            {(
                                [
                                    ['Start', start],
                                    ['End', end],
                                ] as const
                            ).map(([label, value]) =>
                                value ? (
                                    <StackedField key={label} label={label} className="flex-1">
                                        <div className={valueClass}>{value}</div>
                                    </StackedField>
                                ) : null,
                            )}
                        </div>
                    )}

                    {props.roadNumbers && props.roadNumbers.length > 0 && (
                        <StackedField label="Road">
                            <div className={valueClass}>{props.roadNumbers.join(', ')}</div>
                        </StackedField>
                    )}

                    <StackedField label="Incident ID">
                        <span className={`block break-all select-all ${valueClass}`} title={props.id}>
                            {props.id}
                        </span>
                    </StackedField>

                    {props.events.length > 0 && (
                        <StackedField label="Events">
                            <div className="flex flex-wrap gap-1">
                                {props.events.map((event) => (
                                    <span
                                        key={event.code}
                                        className="inline-flex items-center rounded-(--ui-rounded-5) px-2 py-1 text-[12px] leading-4 font-bold"
                                        style={{
                                            background: playbook.surface.surface0,
                                            border: `1px solid ${playbook.border.lowEm}`,
                                            color: playbook.text.highEm,
                                        }}
                                    >
                                        {event.description}
                                    </span>
                                ))}
                            </div>
                        </StackedField>
                    )}
                </div>

                {showPager && (
                    <div
                        className="flex items-center justify-between p-4"
                        style={{ borderTop: `1px solid ${playbook.border.base}` }}
                    >
                        <PagerButton dir="left" onClick={onPrev} disabled={index <= 0} />
                        <span
                            className="text-[14px] leading-5 font-bold"
                            style={{ fontFamily: playbook.font.headings }}
                        >
                            {index + 1} of {total}
                        </span>
                        <PagerButton dir="right" onClick={onNext} disabled={index >= total - 1} />
                    </div>
                )}
            </div>
        </PanelCard>
    );
}
