import { getCoordinateAtRouteProgress, type Route } from '@tomtom-org/maps-sdk/core';
import type { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { Pause, Play } from 'lucide-react';
import { Marker } from 'maplibre-gl';
import { useEffect, useMemo, useState } from 'react';
import { addSeconds, clockTime, distance, duration } from '../format';
import { reclaimCamera } from '../map/cameraHolder';
import { flyRoute } from '../map/routeFlight';
import { type StopMark, stopMarks } from '../sections/routeLanes';
import './TripProgress.css';

const SLIDER_STEPS = 1000;

/**
 * A slider position over the trip, which a fly-over of the route moves while it plays. A new route
 * lands the flight and goes back to the start.
 */
const useReplay = (map: TomTomMap, route: Route) => {
    const [step, setStep] = useState(0);
    const [playing, setPlaying] = useState(false);
    const { travelTimeInSeconds } = route.properties.summary;

    useEffect(() => {
        setStep(0);
        setPlaying(false);
        return reclaimCamera;
    }, [route]);

    const play = (fromStep: number) => {
        setStep(fromStep);
        setPlaying(true);
        flyRoute(map, route, (fromStep / SLIDER_STEPS) * travelTimeInSeconds, {
            onProgress: ({ traveledTimeInSeconds }) =>
                setStep((traveledTimeInSeconds / travelTimeInSeconds) * SLIDER_STEPS),
            onLand: () => setPlaying(false),
        });
    };

    return {
        step,
        playing,
        togglePlaying: () => (playing ? reclaimCamera() : play(step >= SLIDER_STEPS ? 0 : step)),
        scrub: (next: number) => {
            reclaimCamera();
            setStep(next);
        },
    };
};

/** A marker on the map at `position`, gone while there is none. */
const useRouteMarker = (map: TomTomMap, position: number[] | undefined) => {
    const [marker] = useState(() => {
        const element = document.createElement('div');
        element.className = 'ui-progress-marker';
        return new Marker({ element });
    });
    const [longitude, latitude] = position ?? [];

    useEffect(() => {
        if (longitude === undefined || latitude === undefined) marker.remove();
        else marker.setLngLat([longitude, latitude]).addTo(map.mapLibreMap);
    }, [map, marker, longitude, latitude]);

    useEffect(() => () => void marker.remove(), [marker]);
};

/**
 * Scrub the trip by the clock, with a marker that follows the route and waits out each stay, or
 * play it as a fly-over of the route. Before the first move nothing is underway, and
 * `elapsedSeconds` is undefined.
 */
export const useTripReplay = (map: TomTomMap, route: Route) => {
    const { step, playing, togglePlaying, scrub } = useReplay(map, route);
    const { travelTimeInSeconds } = route.properties.summary;
    const elapsedSeconds = (step / SLIDER_STEPS) * travelTimeInSeconds;
    const progress = getCoordinateAtRouteProgress(route, { traveledTimeInSeconds: elapsedSeconds });
    // In flight, the fly-over's own marker rides the route instead.
    useRouteMarker(map, step > 0 && !playing ? progress?.position : undefined);

    return {
        step,
        playing,
        togglePlaying,
        scrub,
        elapsedSeconds: step > 0 ? elapsedSeconds : undefined,
        traveledMeters: progress?.distanceInMeters ?? 0,
        jumpTo: (seconds: number) => scrub(Math.max(1, (seconds / travelTimeInSeconds) * SLIDER_STEPS)),
    };
};

export type TripReplay = ReturnType<typeof useTripReplay>;

type TripProgressProps = { route: Route; stopNames: string[]; replay: TripReplay };

/** Where the trip stands against its stops: staying at one, or on the way to the next. */
const stopStatus = (
    marks: StopMark[],
    stopNames: string[],
    elapsedSeconds: number,
    at: (seconds: number) => string,
) => {
    const index = marks.findIndex(({ leave }) => leave.travelTimeInSeconds > elapsedSeconds);
    if (index === -1) return undefined;

    const { arrive, leave } = marks[index];
    const name = stopNames[index] ?? `Stop ${index}`;
    return arrive.travelTimeInSeconds <= elapsedSeconds
        ? { term: 'Staying', value: `${name} until ${at(leave.travelTimeInSeconds)}` }
        : {
              term: index === marks.length - 1 ? 'Arriving' : 'Next stop',
              value: `${name} at ${at(arrive.travelTimeInSeconds)}`,
          };
};

/** The replay's controls, and where the trip stands at its position. */
export const TripProgress = ({ route, stopNames, replay }: TripProgressProps) => {
    const { step, playing, togglePlaying, scrub, traveledMeters } = replay;
    const elapsedSeconds = replay.elapsedSeconds ?? 0;
    const { travelTimeInSeconds, lengthInMeters, departureTime } = route.properties.summary;
    const marks = useMemo(() => stopMarks(route), [route]);
    const at = (seconds: number) => clockTime(addSeconds(departureTime, seconds));
    const status = stopStatus(marks, stopNames, elapsedSeconds, at);

    return (
        <div className="ui-section ui-trip-progress">
            <div className="ui-progress-controls">
                <button
                    type="button"
                    className="ui-button ui-button-icon ui-button-sm"
                    aria-label={playing ? 'Pause the fly-over' : 'Fly over the trip'}
                    onClick={togglePlaying}
                >
                    {playing ? <Pause /> : <Play />}
                </button>
                <input
                    className="ui-slider"
                    type="range"
                    aria-label="Trip progress"
                    aria-valuetext={at(elapsedSeconds)}
                    min={0}
                    max={SLIDER_STEPS}
                    value={Math.round(step)}
                    onChange={(event) => scrub(Number(event.target.value))}
                />
                <span className="ui-progress-clock">{at(elapsedSeconds)}</span>
            </div>
            <dl className="ui-detail-list">
                {status && (
                    <div>
                        <dt>{status.term}</dt>
                        <dd>{status.value}</dd>
                    </div>
                )}
                <div>
                    <dt>Underway</dt>
                    <dd>
                        {duration(elapsedSeconds)} · {distance(traveledMeters)}
                    </dd>
                </div>
                <div>
                    <dt>To go</dt>
                    <dd>
                        {duration(travelTimeInSeconds - elapsedSeconds)} · {distance(lengthInMeters - traveledMeters)}
                    </dd>
                </div>
            </dl>
        </div>
    );
};
