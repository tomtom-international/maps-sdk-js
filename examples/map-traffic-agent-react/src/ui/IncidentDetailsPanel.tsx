import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';

// ── Constants ───────────────────────────────────────────────────

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

// ── Helpers ─────────────────────────────────────────────────────

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

// ── Main component ──────────────────────────────────────────────

export type IncidentDetailsPanelProps = {
    incident: TrafficIncident;
    overlapCount: number;
    onClose: () => void;
};

export function IncidentDetailsPanel({ incident, overlapCount, onClose }: IncidentDetailsPanelProps) {
    const props = incident.properties;
    const delay = formatDelay(props.delayInSeconds);
    const start = formatTime(props.startTime);
    const end = formatTime(props.endTime);
    const magnitudeColor = MAGNITUDE_COLOR[props.magnitudeOfDelay] ?? MAGNITUDE_COLOR.unknown;
    const magnitudeLabel = MAGNITUDE_LABEL[props.magnitudeOfDelay] ?? props.magnitudeOfDelay;

    return (
        <div className="incident-panel">
            <div className="incident-panel-header">
                <span className="incident-panel-magnitude" style={{ background: magnitudeColor }} />
                <span className="incident-panel-title">{props.category}</span>
                <button className="incident-panel-close" onClick={onClose} aria-label="Close">
                    ×
                </button>
            </div>

            <div className="incident-panel-body">
                {(props.from || props.to) && (
                    <div className="incident-panel-section">
                        {props.from && <div className="incident-panel-location">From {props.from}</div>}
                        {props.to && <div className="incident-panel-location">To {props.to}</div>}
                    </div>
                )}

                <div className="incident-panel-stats">
                    <div className="incident-panel-stat">
                        <div className="incident-panel-stat-label">Severity</div>
                        <div className="incident-panel-stat-value">{magnitudeLabel}</div>
                    </div>
                    {delay && (
                        <div className="incident-panel-stat">
                            <div className="incident-panel-stat-label">Delay</div>
                            <div className="incident-panel-stat-value">{delay}</div>
                        </div>
                    )}
                    {props.lengthInMeters !== undefined && (
                        <div className="incident-panel-stat">
                            <div className="incident-panel-stat-label">Length</div>
                            <div className="incident-panel-stat-value">
                                {props.lengthInMeters >= 1000
                                    ? `${(props.lengthInMeters / 1000).toFixed(1)} km`
                                    : `${Math.round(props.lengthInMeters)} m`}
                            </div>
                        </div>
                    )}
                    {props.probabilityOfOccurrence && (
                        <div className="incident-panel-stat">
                            <div className="incident-panel-stat-label">Probability</div>
                            <div className="incident-panel-stat-value">{props.probabilityOfOccurrence}</div>
                        </div>
                    )}
                </div>

                {(start || end) && (
                    <div className="incident-panel-section">
                        <div className="incident-panel-label">When</div>
                        {start && <div className="incident-panel-time">Start: {start}</div>}
                        {end && <div className="incident-panel-time">End: {end}</div>}
                    </div>
                )}

                {props.events.length > 0 && (
                    <div className="incident-panel-section">
                        <div className="incident-panel-label">Events</div>
                        <ul className="incident-panel-events">
                            {props.events.map((event) => (
                                <li key={event.code}>{event.description}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {props.roadNumbers && props.roadNumbers.length > 0 && (
                    <div className="incident-panel-section">
                        <div className="incident-panel-label">Road</div>
                        <div className="incident-panel-roads">{props.roadNumbers.join(', ')}</div>
                    </div>
                )}

                {overlapCount > 1 && (
                    <div className="incident-panel-overlap">
                        {overlapCount - 1} other incident{overlapCount - 1 === 1 ? '' : 's'} at this location
                    </div>
                )}

                <div className="incident-panel-section">
                    <div className="incident-panel-label">Incident ID</div>
                    <code className="incident-panel-id" title={props.id}>
                        {props.id}
                    </code>
                </div>
            </div>
        </div>
    );
}
