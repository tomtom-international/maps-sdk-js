import type { FlightLeg, LandmarkTurn, StreetRun } from './flybys';

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

const METERS_PER_DEGREE = 111_320;
const GRAVITY = 9.81;
// The path is sampled every this many metres.
const STEP_METERS = 10;
const LANDMARK_METERS_PER_SECOND = 55;
// A turn round a landmark shorter than this goes once round more, rather than glancing off it.
const MIN_TURN_DEGREES = 30;
// On a turn the camera looks this far from straight ahead towards the landmark, 1 being at it.
const LANDMARK_FOCUS = 0.75;
const STREET_METERS_PER_SECOND = 45;
const TRANSIT_METERS_PER_SECOND = 60;
// Between two legs the camera soars, rising this much per metre between them, up to the cap, and glides back down.
const TRANSIT_CLIMB_PER_METER = 0.12;
const MAX_TRANSIT_CLIMB_METERS = 350;
// Moving averages over this many samples either side: the path rounds its corners, and the camera
// turns towards a landmark over a longer stretch than it takes to fly into its turn.
const PATH_SMOOTHING_SAMPLES = 10;
const FOCUS_SMOOTHING_SAMPLES = 30;
// And the camera's turn, tilt and bank are eased over this many samples either side of each one.
const VIEW_SMOOTHING_SAMPLES = 8;
// Down a street the camera looks this far along the path, tilted this far from straight down: skimming
// the roofs at the first altitude, looking further down from the second.
const LOOK_AHEAD_METERS = 160;
const LOW_CRUISE_PITCH = 72;
const HIGH_CRUISE_PITCH = 58;
const LOW_METERS = 100;
const HIGH_METERS = 600;
const MIN_LANDMARK_PITCH = 45;
const MAX_LANDMARK_PITCH = 82;
// The camera looks at a landmark beside the path in full, and lets go of it between these two angles behind.
const BESIDE_COS = Math.cos(toRadians(105));
const BEHIND_COS = Math.cos(toRadians(150));
// The turn the bank reads is measured over this much path either side.
const BANK_SPAN_METERS = 50;
const MAX_BANK_DEGREES = 40;

type Point2 = { x: number; y: number };
type Point = Point2 & { z: number };
type Sample = Point & { speed: number; focus: number; target?: Point; leg: number };
type View = { bearing: number; pitch: number; roll: number };

/** Where the camera is and how it's turned, ready for MapLibre's `calculateCameraOptionsFromCameraLngLatAltRotation`. */
export type FlightCamera = { lngLat: [number, number]; altitude: number; bearing: number; pitch: number; roll: number };

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
const lerpPoint = (from: Point, to: Point, t: number): Point => ({
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
    z: lerp(from.z, to.z, t),
});
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const smoothstep = (from: number, to: number, value: number) => {
    const t = clamp((value - from) / (to - from), 0, 1);
    return t * t * (3 - 2 * t);
};
// The signed turn from one bearing to another, -180 to 180.
const turnBetween = (from: number, to: number) => ((((to - from) % 360) + 540) % 360) - 180;
const bearingBetween = (from: Point2, to: Point2) => toDegrees(Math.atan2(to.x - from.x, to.y - from.y));
const distanceBetween = (from: Point2, to: Point2) => Math.hypot(to.x - from.x, to.y - from.y);

// Where a distance falls on a closed path of `count` samples: the sample before it, the next one, and how far between them.
const sampleSpanAt = (distance: number, count: number) => {
    const position = (((distance / STEP_METERS) % count) + count) % count;
    const index = Math.floor(position);
    return { index, next: (index + 1) % count, t: position - index };
};

const smoothCircular = (values: number[], radius: number): number[] =>
    values.map((_, index) => {
        let sum = 0;
        for (let offset = -radius; offset <= radius; offset++) {
            sum += values[(index + offset + values.length) % values.length];
        }
        return sum / (2 * radius + 1);
    });

const smoothedTwice = (values: number[], radius: number) => smoothCircular(smoothCircular(values, radius), radius);

// Every STEP_METERS along the closed polyline; between two legs, the camera flies straight on, named after the leg it left.
const resampled = (points: Sample[]): Sample[] => {
    const samples: Sample[] = [];
    let carried = 0;
    for (let i = 0; i < points.length; i++) {
        const from = points[i];
        const to = points[(i + 1) % points.length];
        const between = from.leg !== to.leg;
        const length = distanceBetween(from, to);
        const climb = between ? Math.min(MAX_TRANSIT_CLIMB_METERS, length * TRANSIT_CLIMB_PER_METER) : 0;
        let along = carried;
        for (; along < length; along += STEP_METERS) {
            const t = along / length;
            samples.push({
                x: lerp(from.x, to.x, t),
                y: lerp(from.y, to.y, t),
                z: lerp(from.z, to.z, t) + climb * Math.sin(Math.PI * t),
                speed: between ? TRANSIT_METERS_PER_SECOND : from.speed,
                focus: between ? 0 : from.focus,
                target: between ? undefined : from.target,
                leg: from.leg,
            });
        }
        carried = along - length;
    }
    return samples;
};

// Away from a landmark's turn the camera turns towards the nearest landmark along the path, as far as `focus` says.
const withNearestTargets = (samples: Sample[]): Sample[] =>
    samples.map((sample, index) => {
        if (sample.target) return sample;
        for (let offset = 1; offset < samples.length; offset++) {
            const target =
                samples[(index + offset) % samples.length].target ??
                samples[(index - offset + samples.length) % samples.length].target;
            if (target) return { ...sample, target };
        }
        return sample;
    });

const smoothed = (samples: Sample[]): Sample[] => {
    const [x, y, z, speed] = (['x', 'y', 'z', 'speed'] as const).map((key) =>
        smoothedTwice(
            samples.map((sample) => sample[key]),
            PATH_SMOOTHING_SAMPLES,
        ),
    );
    const focus = smoothCircular(
        samples.map((sample) => sample.focus),
        FOCUS_SMOOTHING_SAMPLES,
    );
    // Between two landmarks next to each other, the camera's aim glides from one landmark to the other.
    const [targetX, targetY, targetZ] = (['x', 'y', 'z'] as const).map((key) =>
        smoothedTwice(
            samples.map((sample) => sample.target?.[key] ?? 0),
            FOCUS_SMOOTHING_SAMPLES,
        ),
    );
    return samples.map((sample, index) => ({
        ...sample,
        x: x[index],
        y: y[index],
        z: z[index],
        speed: speed[index],
        focus: focus[index],
        target: sample.target && { x: targetX[index], y: targetY[index], z: targetZ[index] },
    }));
};

/**
 * A fly-by as one closed path, in metres east and north of its first landmark: each leg sampled, a
 * straight flight between legs, and the corners rounded so the camera turns smoothly.
 */
export class FlightPath {
    readonly length: number;
    private readonly origin: [number, number];
    private readonly metersPerDegreeEast: number;
    private readonly samples: Sample[];
    private readonly views: View[];

    /**
     * @param legs - The fly-by's legs; the first must be a landmark, where the opening shot is.
     * @param streets - The road geometry of each street run, by leg index; a run without one flies its sketch.
     */
    constructor(
        readonly legs: [LandmarkTurn, ...FlightLeg[]],
        streets: ReadonlyMap<number, [number, number][]> = new Map(),
    ) {
        this.origin = legs[0].center;
        this.metersPerDegreeEast = METERS_PER_DEGREE * Math.cos(toRadians(this.origin[1]));
        const streetPoints = legs.map((leg, index) =>
            leg.kind === 'street' ? this.streetPoints(leg, index, streets.get(index)) : [],
        );
        // Where a landmark's neighbour hands over: the near end of a street run, the centre of another landmark.
        const handover = (index: number, end: 'first' | 'last'): Point2 => {
            const at = (index + legs.length) % legs.length;
            const leg = legs[at];
            if (leg.kind === 'landmark') return this.toLocal(leg.center);
            const points = streetPoints[at];
            return end === 'first' ? points[0] : points[points.length - 1];
        };
        const legPoints = legs.flatMap((leg, index) =>
            leg.kind === 'street'
                ? streetPoints[index]
                : this.turnPoints(leg, index, handover(index - 1, 'last'), handover(index + 1, 'first')),
        );
        this.samples = smoothed(withNearestTargets(resampled(legPoints)));
        this.length = this.samples.length * STEP_METERS;
        this.views = this.smoothViews();
    }

    /** How far along the path the opening shot is: halfway round the turn at the first landmark. */
    get openingDistance(): number {
        const first = this.samples.findIndex((sample) => sample.leg === 0);
        const count = this.samples.filter((sample) => sample.leg === 0).length;
        return (first + count / 2) * STEP_METERS;
    }

    speedAt(distance: number): number {
        return this.at(distance).speed;
    }

    /** The name of the leg flown at this distance, kept through the flight to the next one. */
    labelAt(distance: number): string {
        return this.legs[this.at(distance).leg].label;
    }

    cameraAt(distance: number): FlightCamera {
        const here = this.at(distance);
        const { index, next, t } = sampleSpanAt(distance, this.views.length);
        const from = this.views[index];
        const to = this.views[next];
        return {
            lngLat: this.toLngLat(here),
            altitude: here.z,
            bearing: from.bearing + turnBetween(from.bearing, to.bearing) * t,
            pitch: lerp(from.pitch, to.pitch, t),
            roll: lerp(from.roll, to.roll, t),
        };
    }

    // Where the camera looks at each sample, before smoothing: along the path, at a landmark, banked into the turn.
    private view(distance: number): View {
        const here = this.at(distance);
        const heading = bearingBetween(here, this.at(distance + LOOK_AHEAD_METERS));
        let bearing = heading;
        const cruisePitch = lerp(LOW_CRUISE_PITCH, HIGH_CRUISE_PITCH, smoothstep(LOW_METERS, HIGH_METERS, here.z));
        let pitch = cruisePitch;
        const { target } = here;
        if (target && here.focus > 0) {
            const towards = bearingBetween(here, target);
            const lookPitch = toDegrees(Math.atan2(distanceBetween(here, target), here.z - target.z));
            // A landmark falling behind lets the camera go, rather than have it turn round.
            const focus = here.focus * smoothstep(BEHIND_COS, BESIDE_COS, Math.cos(toRadians(towards - heading)));
            bearing = heading + turnBetween(heading, towards) * focus;
            pitch = lerp(cruisePitch, clamp(lookPitch, MIN_LANDMARK_PITCH, MAX_LANDMARK_PITCH), focus);
        }

        // A coordinated turn banks by atan(v² · curvature / g); looking sideways, the camera sees it as a tilt, not a roll.
        const before = this.at(distance - BANK_SPAN_METERS);
        const after = this.at(distance + BANK_SPAN_METERS);
        const curvature =
            toRadians(turnBetween(bearingBetween(before, here), bearingBetween(here, after))) / (2 * BANK_SPAN_METERS);
        const bank = clamp(
            toDegrees(Math.atan((here.speed * here.speed * curvature) / GRAVITY)),
            -MAX_BANK_DEGREES,
            MAX_BANK_DEGREES,
        );
        const pathHeading = bearingBetween(before, after);

        return { bearing, pitch, roll: bank * Math.cos(toRadians(bearing - pathHeading)) };
    }

    private smoothViews(): View[] {
        const raw = this.samples.map((_, index) => this.view(index * STEP_METERS));
        const twice = (values: number[]) => smoothedTwice(values, VIEW_SMOOTHING_SAMPLES);
        // Bearings average as directions, so the turn through north doesn't average to south.
        const east = twice(raw.map((view) => Math.sin(toRadians(view.bearing))));
        const north = twice(raw.map((view) => Math.cos(toRadians(view.bearing))));
        const pitch = twice(raw.map((view) => view.pitch));
        const roll = twice(raw.map((view) => view.roll));
        return raw.map((_, index) => ({
            bearing: toDegrees(Math.atan2(east[index], north[index])),
            pitch: pitch[index],
            roll: roll[index],
        }));
    }

    private toLocal([lng, lat]: [number, number]): Point2 {
        return { x: (lng - this.origin[0]) * this.metersPerDegreeEast, y: (lat - this.origin[1]) * METERS_PER_DEGREE };
    }

    private toLngLat({ x, y }: Point2): [number, number] {
        return [this.origin[0] + x / this.metersPerDegreeEast, this.origin[1] + y / METERS_PER_DEGREE];
    }

    private streetPoints(leg: StreetRun, index: number, street: [number, number][] | undefined): Sample[] {
        const points = (street ?? leg.path).map((position) => this.toLocal(position));
        const along = [0];
        for (let i = 1; i < points.length; i++) {
            along.push(along[i - 1] + distanceBetween(points[i - 1], points[i]));
        }
        const runLength = along[along.length - 1];
        const [from, to] = leg.altitudeMeters;
        return points.map((point, at) => ({
            ...point,
            z: lerp(from, to, smoothstep(0, runLength, along[at])),
            speed: STREET_METERS_PER_SECOND,
            focus: 0,
            leg: index,
        }));
    }

    // From the tangent the camera arrives on, round to the tangent it leaves on, whichever way round is shorter.
    private turnPoints(leg: LandmarkTurn, index: number, from: Point2, to: Point2): Sample[] {
        const center = this.toLocal(leg.center);
        const target = { ...center, z: leg.heightMeters / 2 };
        // Seen from the centre, the bearing where a line from `point` touches the circle, on the given side.
        const tangent = (point: Point2, side: number) =>
            bearingBetween(center, point) +
            side * toDegrees(Math.acos(Math.min(1, leg.radiusMeters / distanceBetween(center, point))));
        // 1 turns clockwise, -1 anticlockwise.
        const [{ entry, sweep }] = [1, -1]
            .map((turn) => {
                const entry = tangent(from, turn);
                const arc = ((((tangent(to, -turn) - entry) * turn) % 360) + 360) % 360;
                return { entry, sweep: turn * (arc < MIN_TURN_DEGREES ? arc + 360 : arc) };
            })
            .sort((one, other) => Math.abs(one.sweep) - Math.abs(other.sweep));
        const steps = Math.ceil((Math.abs(toRadians(sweep)) * leg.radiusMeters) / STEP_METERS);
        return Array.from({ length: steps + 1 }, (_, step) => {
            const bearing = toRadians(entry + (sweep * step) / steps);
            return {
                x: center.x + leg.radiusMeters * Math.sin(bearing),
                y: center.y + leg.radiusMeters * Math.cos(bearing),
                z: leg.altitudeMeters,
                speed: LANDMARK_METERS_PER_SECOND,
                focus: LANDMARK_FOCUS,
                target,
                leg: index,
            };
        });
    }

    private at(distance: number): Sample {
        const { index, next, t } = sampleSpanAt(distance, this.samples.length);
        const from = this.samples[index];
        const to = this.samples[next];
        return {
            ...from,
            ...lerpPoint(from, to, t),
            speed: lerp(from.speed, to.speed, t),
            focus: lerp(from.focus, to.focus, t),
            target: from.target && to.target && lerpPoint(from.target, to.target, t),
        };
    }
}
