import type { Route } from '@tomtom-org/maps-sdk/core';
import { X } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { isTraffic, type LaneBlock, laneLook } from './routeLanes';
import { type SectionEnd, sectionDetails } from './sectionDetails';
import { useIncident, useLocality } from './useSectionLookups';
import '../panel/PlaceCard.css';
import './routeLanes.css';
import './SectionDetailsCard.css';

type SectionDetailsCardProps = { route: Route; block: LaneBlock; onClose: () => void };

/** A clicked section: where and when it starts and ends, and what only its kind can tell. */
export const SectionDetailsCard = ({ route, block, onClose }: SectionDetailsCardProps) => {
    const details = useMemo(() => sectionDetails(route, block), [route, block]);
    const { label, icon: Icon } = laneLook(block.lane);
    useEffect(() => {
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [onClose]);

    return (
        <section className="ui-customPanel ui-section-details" aria-label={`${label}: ${details.title}`}>
            <header className="ui-section-details-header">
                <span className={`ui-section-details-icon ui-lane-${block.lane}${block.tone ? ` ${block.tone}` : ''}`}>
                    {Icon && <Icon aria-hidden="true" />}
                </span>
                <div className="ui-section-details-heading">
                    <span className="ui-place-card-label">{label}</span>
                    <h4 className="ui-place-card-title">{details.title}</h4>
                </div>
                <button
                    type="button"
                    className="ui-button ui-button-ghost ui-button-icon ui-button-xs"
                    aria-label="Close the section details"
                    onClick={onClose}
                >
                    <X />
                </button>
            </header>
            <ol className="ui-section-ends" aria-label={details.span}>
                <SectionEndRow kind="Starts" end={details.start} />
                <li className="ui-section-span">{details.span}</li>
                <SectionEndRow kind="Ends" end={details.end} />
            </ol>
            {isTraffic(block.section) && <IncidentReport eventId={block.section.eventId} />}
            {details.facts.length > 0 && (
                <dl className="ui-detail-list">
                    {details.facts.map(({ term, value }) => (
                        <div key={term}>
                            <dt>{term}</dt>
                            <dd>{value}</dd>
                        </div>
                    ))}
                </dl>
            )}
        </section>
    );
};

/** One end of the section: the road from the route, and the place near it, once looked up. */
const SectionEndRow = ({ kind, end }: { kind: string; end: SectionEnd }) => {
    const { data: locality, isPending } = useLocality(end.position);
    const near = locality && (end.road ? `near ${locality}` : locality);
    return (
        <li className="ui-section-end">
            <span className="ui-section-end-when">
                <strong>
                    {kind} {end.clock}
                </strong>{' '}
                · {end.into}
            </span>
            {end.road && <span className="ui-section-end-road">{end.road}</span>}
            <span className="ui-section-end-near">{isPending ? 'Finding the place…' : near}</span>
        </li>
    );
};

const reportTime = (date: Date): string => date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

/** What the traffic service reports about the incident behind a traffic section. */
const IncidentReport = ({ eventId }: { eventId?: string }) => {
    const { data: incident, isPending, isError } = useIncident(eventId);
    if (!eventId || isError || incident === null) return null;
    if (isPending) return <p className="ui-note">Loading the incident report…</p>;

    const descriptions = [...new Set(incident.events.map((event) => event.description))];
    const times = [
        incident.startTime && `Since ${reportTime(incident.startTime)}`,
        incident.endTime && `Until ${reportTime(incident.endTime)}`,
    ].filter(Boolean);
    return (
        <div className="ui-incident-report">
            <p className="ui-incident-description">{descriptions.join('. ')}</p>
            {(incident.from || incident.to) && (
                <p className="ui-incident-extent">
                    {[incident.from, incident.to].filter(Boolean).join(' → ')}
                    {incident.roadNumbers?.length ? ` (${incident.roadNumbers.join(', ')})` : ''}
                </p>
            )}
            {times.length > 0 && <p className="ui-incident-extent">{times.join(' · ')}</p>}
        </div>
    );
};
