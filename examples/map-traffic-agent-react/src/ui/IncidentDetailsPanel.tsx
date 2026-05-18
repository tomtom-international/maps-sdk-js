import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';

const MAGNITUDE_COLOR: Record<string, string> = {
    unknown: 'hsl(198, 20%, 54%)',
    minor: 'hsl(45, 100%, 51%)',
    moderate: 'hsl(9, 97%, 51%)',
    major: 'hsl(0, 100%, 34%)',
    indefinite: 'hsl(0, 100%, 34%)',
};

const MAGNITUDE_LABEL: Record<string, string> = {
    unknown: 'No delay',
    minor: 'Minor',
    moderate: 'Moderate',
    major: 'Major',
    indefinite: 'Road closed',
};

function formatDelay(seconds: number | undefined): string | null {
    if (seconds === undefined) return null;
    if (seconds < 60) return '< 1 min';
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder === 0 ? `${hours} hr` : `${hours} hr ${remainder} min`;
}

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

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-(--sdk-radius-5) border border-(--sdk-border-low) bg-(--sdk-surface-1) p-2">
            <div className="text-(--sdk-font-caption-s) uppercase text-(--sdk-text-low)">{label}</div>
            <div className="text-(--sdk-font-body-l) font-semibold capitalize">{value}</div>
        </div>
    );
}

function Section({ children }: { children: React.ReactNode }) {
    return <div className="flex flex-col gap-1">{children}</div>;
}

const LABEL_CLASS = 'text-(--sdk-font-caption-s) font-semibold uppercase text-(--sdk-text-low)';

export function IncidentDetailsPanel({ incident, overlapCount, onClose }: IncidentDetailsPanelProps) {
    const props = incident.properties;
    const delay = formatDelay(props.delayInSeconds);
    const start = formatTime(props.startTime);
    const end = formatTime(props.endTime);
    const magnitudeColor = MAGNITUDE_COLOR[props.magnitudeOfDelay] ?? MAGNITUDE_COLOR.unknown;
    const magnitudeLabel = MAGNITUDE_LABEL[props.magnitudeOfDelay] ?? props.magnitudeOfDelay;

    return (
        <div className="col-start-1 row-start-2 w-[340px] max-w-full max-h-full self-start justify-self-start overflow-auto rounded-(--sdk-radius-10) border border-(--sdk-border-low) bg-(--sdk-surface-0) p-(--sdk-panel-padding) text-(--sdk-font-body-s) text-(--sdk-text-high) shadow-(--sdk-shadow-e4) backdrop-blur-md">
            <div className="mb-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: magnitudeColor }} />
                <span className="flex-1 text-(--sdk-font-body-m) font-semibold capitalize">{props.category}</span>
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-(--sdk-radius-5) border-0 bg-transparent p-0 text-[20px] leading-none text-(--sdk-text-medium) hover:bg-(--sdk-surface-1) hover:text-(--sdk-text-high)"
                >
                    ×
                </button>
            </div>

            <div className="flex flex-col gap-3">
                {(props.from || props.to) && (
                    <Section>
                        {props.from && (
                            <div className="text-(--sdk-font-body-s) text-(--sdk-text-high)">From {props.from}</div>
                        )}
                        {props.to && (
                            <div className="text-(--sdk-font-body-s) text-(--sdk-text-high)">To {props.to}</div>
                        )}
                    </Section>
                )}

                <div className="grid grid-cols-2 gap-2">
                    <Stat label="Severity" value={magnitudeLabel} />
                    {delay && <Stat label="Delay" value={delay} />}
                    {props.lengthInMeters !== undefined && (
                        <Stat
                            label="Length"
                            value={
                                props.lengthInMeters >= 1000
                                    ? `${(props.lengthInMeters / 1000).toFixed(1)} km`
                                    : `${Math.round(props.lengthInMeters)} m`
                            }
                        />
                    )}
                    {props.probabilityOfOccurrence && (
                        <Stat label="Probability" value={props.probabilityOfOccurrence} />
                    )}
                </div>

                {(start || end) && (
                    <Section>
                        <div className={LABEL_CLASS}>When</div>
                        {start && (
                            <div className="text-(--sdk-font-caption-m) text-(--sdk-text-medium)">Start: {start}</div>
                        )}
                        {end && <div className="text-(--sdk-font-caption-m) text-(--sdk-text-medium)">End: {end}</div>}
                    </Section>
                )}

                {props.events.length > 0 && (
                    <Section>
                        <div className={LABEL_CLASS}>Events</div>
                        <ul className="m-0 list-disc pl-3 [&>li]:text-(--sdk-font-caption-m) [&>li]:text-(--sdk-text-medium)">
                            {props.events.map((event) => (
                                <li key={event.code}>{event.description}</li>
                            ))}
                        </ul>
                    </Section>
                )}

                {props.roadNumbers && props.roadNumbers.length > 0 && (
                    <Section>
                        <div className={LABEL_CLASS}>Road</div>
                        <div className="text-(--sdk-font-body-s) font-semibold">{props.roadNumbers.join(', ')}</div>
                    </Section>
                )}

                {overlapCount > 1 && (
                    <div className="rounded-(--sdk-radius-5) border border-(--sdk-border-low) bg-(--sdk-surface-1) p-2 text-center text-(--sdk-font-caption-m) text-(--sdk-text-medium)">
                        {overlapCount - 1} other incident{overlapCount - 1 === 1 ? '' : 's'} at this location
                    </div>
                )}

                <Section>
                    <div className={LABEL_CLASS}>Incident ID</div>
                    <code
                        className="block break-all font-mono text-(--sdk-font-caption-m) text-(--sdk-text-medium) select-all"
                        title={props.id}
                    >
                        {props.id}
                    </code>
                </Section>
            </div>
        </div>
    );
}
