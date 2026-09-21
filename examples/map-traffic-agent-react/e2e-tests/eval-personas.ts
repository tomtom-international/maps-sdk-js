/**
 * Calibration personas for the live-traffic agent. Each entry is a persona
 * (name, description, overarching goal) plus the concrete tasks that seed one
 * evaluation run each — the eval spec loops personas × tasks.
 *
 * The five Live-Traffic personas (TOC, Fleet, Roadworks, Event Ops, Emergency)
 * carry 10 tasks each, split into two labeling groups of 5 per persona so a
 * PM reviews one coherent domain at a time. Retail Expansion Manager is kept for
 * the existing corpus but is not part of the live-traffic labeling batch.
 *
 * Tasks are phrased around Las Vegas — the same market the app opens on — so a
 * viewport-scoped answer and a named-area answer describe the same network.
 */
import type { Persona } from 'agent-eval';

export type OutcomeBucket = 'clear-pass' | 'clear-fail' | 'partial' | 'tool-failure' | 'honest-refusal' | 'turn-cap';

export interface EvalTask {
    title: string;
    description: string;
    bucket?: OutcomeBucket;
}

export interface PersonaAndTasks {
    persona: Persona;
    tasks: EvalTask[];
}

export const evalPersonas: PersonaAndTasks[] = [
    {
        persona: {
            name: 'Retail Expansion Manager',
            description:
                'I am a retail manager with 15 years of experience, scouting locations for new stores. I care about shopping areas, nearby retail, and how easy a spot is to reach.',
            goal: 'Identify and compare candidate retail locations for store expansion',
        },
        tasks: [
            {
                title: 'find shopping centres',
                description: 'Find shopping centres in Las Vegas.',
                bucket: 'clear-pass',
            },
            {
                title: 'compare areas',
                description: 'Compare the shopping options around Downtown Summerlin versus the Las Vegas Strip.',
                bucket: 'partial',
            },
            {
                title: 'unavailable data',
                description: 'What is the average daily foot traffic on the main shopping streets in Las Vegas?',
                bucket: 'honest-refusal',
            },
        ],
    },
    {
        persona: {
            name: 'Fleet Dispatcher (Logistics / Delivery)',
            description:
                'Intermediate expertise in logistics operations. Speaks in terms of vehicles in the field, routes, closures, re-sequencing, ETA impact, and affected runs.',
            goal: 'React to disruption affecting field vehicles',
        },
        tasks: [
            {
                title: 'closure impact on fleet',
                description:
                    'Show me the current traffic incidents and closures across Las Vegas that could affect our delivery runs.',
                bucket: 'clear-pass',
            },
            {
                title: 'alternative depot routes',
                description:
                    'Show me the fastest alternative routes from our depot at 4000 W Sunset Rd, Las Vegas to E Charleston Blvd, Las Vegas, avoiding the current congestion.',
                bucket: 'clear-pass',
            },
            {
                // HARD: exact percentage vs a historical baseline the live data can't provide — tempts fabrication.
                title: 'percent slower than last week',
                description:
                    'By exactly what percentage are our delivery routes across Las Vegas slower today than they were last Tuesday?',
                bucket: 'clear-fail',
            },
            {
                title: 'incidents along route',
                description:
                    'What traffic incidents are on the route from North Las Vegas to the Fremont Street Experience right now?',
                bucket: 'clear-pass',
            },
            {
                title: 'severity and spread',
                description:
                    'How severe is the congestion on I-15 north of the Spaghetti Bowl in Las Vegas right now, and is it spreading south?',
                bucket: 'partial',
            },
            {
                title: 'closures only',
                description: 'Show me only the full road closures in Las Vegas right now — not the minor incidents.',
                bucket: 'partial',
            },
            {
                title: 'reroute around congestion',
                description:
                    'Find the fastest current route from our depot at 4000 W Sunset Rd, Las Vegas to Harry Reid International Airport avoiding the congestion.',
                bucket: 'clear-pass',
            },
            {
                title: 'congestion ETA impact',
                description: 'How much is the current congestion adding to a trip from North Las Vegas to Henderson?',
                bucket: 'partial',
            },
            {
                title: 'affected outbound roads',
                description:
                    'Which major roads out of Downtown Las Vegas are congested enough right now to delay our afternoon deliveries?',
                bucket: 'partial',
            },
            {
                // HARD: future prediction the live data can't support.
                title: 'predict evening window',
                description: 'Will I-15 in Las Vegas be congested for our 6pm delivery window tonight?',
                bucket: 'clear-fail',
            },
        ],
    },
    {
        persona: {
            name: 'Construction / Roadworks Planner',
            description:
                'Intermediate expertise in roadworks planning. Speaks in terms of lane closures, diversions, downstream impact, cut-through traffic, works zones, concurrent works, and spillover.',
            goal: "See a work zone's real-time downstream impact",
        },
        // Discovery-first: never presuppose roadworks on a specific named street (there may be none live);
        // ask the agent to find where roadworks actually are, then reason about their impact nearby.
        tasks: [
            {
                title: 'where are roadworks',
                description: 'Where are there roadworks in Las Vegas right now?',
                bucket: 'clear-pass',
            },
            {
                title: 'roadworks nearby flow',
                description:
                    'Where are the roadworks in Las Vegas right now, and how are they affecting traffic on the streets nearby?',
                bucket: 'partial',
            },
            {
                title: 'roadworks and incidents',
                description:
                    'Show me all the current roadworks and incidents affecting traffic across Las Vegas today.',
                bucket: 'clear-pass',
            },
            {
                title: 'most disruptive roadworks',
                description:
                    'Which of the roadworks currently active in Las Vegas are disrupting nearby traffic the most?',
                bucket: 'partial',
            },
            {
                title: 'closures from roadworks',
                description: 'Are any roads in Las Vegas currently closed because of roadworks?',
                bucket: 'partial',
            },
            {
                title: 'roadworks in city centre',
                description:
                    'Are there any roadworks in Downtown Las Vegas right now, and what are the traffic conditions like around them?',
                bucket: 'partial',
            },
            {
                title: 'lane closure planning',
                description:
                    "We're planning to close a lane on E Charleston Blvd, Las Vegas. What's the live traffic there right now, and which nearby roads would absorb the diverted traffic?",
                bucket: 'clear-pass',
            },
            {
                title: 'cut-through spillover',
                description:
                    'For the roadworks currently active in Las Vegas, are vehicles cutting through nearby residential streets to avoid them?',
                bucket: 'partial',
            },
            {
                title: 'focus busiest roadworks',
                description:
                    'Focus the map on the roadworks in Las Vegas that are affecting traffic the most, and show the conditions around them.',
                bucket: 'clear-pass',
            },
            {
                // HARD: future prediction the live data can't support.
                title: 'predict tomorrow',
                description: 'Will the roadworks congestion in Las Vegas be worse tomorrow morning?',
                bucket: 'clear-fail',
            },
        ],
    },
    {
        persona: {
            name: 'City Traffic Operations Center (TOC) Operator',
            description:
                'Expert in network monitoring. Speaks in terms of network performance, speed delta, incidents, queue tails, signal timing, SCADA, congestion clusters, and heatmaps.',
            goal: "See what's changing on the network in seconds",
        },
        tasks: [
            {
                title: 'network overview',
                description: "What's happening on the network right now?",
                bucket: 'clear-pass',
            },
            {
                title: 'top congested intersections',
                description: 'Where are the top 3 congested intersections in the city right now?',
                bucket: 'clear-pass',
            },
            {
                title: 'delays vs typical peak',
                description: 'Are the delays on US-95 right now worse than the typical Tuesday PM peak?',
                // Historical comparison the live data can't answer — should be declined honestly.
                bucket: 'honest-refusal',
            },
            {
                title: 'weather forecast',
                description: 'What will the weather be like in Las Vegas tomorrow afternoon?',
                // Out of the traffic agent's domain entirely.
                bucket: 'clear-fail',
            },
            {
                // HARD: per-segment exact vehicle counts and speeds the tools don't return — tempts fabrication.
                title: 'exact segment counts',
                description:
                    'Give me the exact current vehicle count and average speed for every segment of the I-215 Beltway right now.',
                bucket: 'clear-fail',
            },
            {
                title: 'live ring speeds',
                description: 'What are the current speeds on the I-215 Beltway around Las Vegas right now?',
                bucket: 'clear-pass',
            },
            {
                title: 'delta vs free-flow',
                description: 'How far below free-flow are speeds in Downtown Las Vegas right now?',
                bucket: 'partial',
            },
            {
                title: 'accidents only',
                description:
                    'Show me only the accidents in Las Vegas right now — not roadworks or other incident types.',
                bucket: 'partial',
            },
            {
                title: 'focus corridor',
                description:
                    'Focus the map on the Spaghetti Bowl interchange in Las Vegas and show what is happening there right now.',
                bucket: 'clear-pass',
            },
            {
                title: 'cluster spread',
                description:
                    'Is the congestion around the I-15 / I-215 interchange in Las Vegas growing or easing right now?',
                bucket: 'partial',
            },
        ],
    },
    {
        persona: {
            name: 'Event Operations Lead',
            description:
                'Tracks ingress and egress around a venue live. Speaks in terms of approaches, gate routes, venue-adjacent incidents, and per-approach congestion as it happens.',
            goal: 'Track ingress and egress around a venue live',
        },
        tasks: [
            {
                title: 'approach congestion',
                description: 'Show the current approach-route congestion around Allegiant Stadium, Las Vegas.',
                bucket: 'partial',
            },
            {
                title: 'incidents on approaches',
                description:
                    'What traffic incidents are on the main approaches to Allegiant Stadium, Las Vegas right now?',
                bucket: 'clear-pass',
            },
            {
                title: 'per-approach speeds',
                description:
                    'What are the current speeds on each main approach to T-Mobile Arena, Las Vegas right now?',
                bucket: 'partial',
            },
            {
                title: 'focus venue',
                description:
                    'Focus the map on the Las Vegas Convention Center and its approaches and show the live conditions.',
                bucket: 'clear-pass',
            },
            {
                title: 'egress route',
                description: 'Plan the clearest current route out of Allegiant Stadium, Las Vegas toward I-15.',
                bucket: 'clear-pass',
            },
            {
                title: 'incidents near venue',
                description: 'Are there any traffic incidents within 1 km of Sphere, Las Vegas right now?',
                bucket: 'clear-pass',
            },
            {
                title: 'building congestion',
                description: 'Is congestion building around T-Mobile Arena, Las Vegas right now?',
                bucket: 'partial',
            },
            {
                title: 'least congested approach',
                description: 'Which approach to Allegiant Stadium, Las Vegas is currently the least congested?',
                bucket: 'partial',
            },
            {
                // Out of the traffic agent's domain — crowd attendance is not traffic data.
                title: 'crowd size refusal',
                description: 'How many people are expected to arrive at Allegiant Stadium, Las Vegas tonight?',
                bucket: 'clear-fail',
            },
            {
                // Historical pattern the live data can't answer.
                title: 'usual concert pattern',
                description: 'What is the usual traffic pattern around T-Mobile Arena, Las Vegas on a concert night?',
                bucket: 'honest-refusal',
            },
        ],
    },
    {
        persona: {
            name: 'Emergency Dispatch Coordinator',
            description:
                'Expert in emergency response operations. Speaks in terms of responder routing, congestion avoidance, incident location, secondary congestion, response time, and clear routes.',
            goal: 'Route responders around live congestion',
        },
        tasks: [
            {
                title: 'clearest responder route',
                description:
                    "Show me the current traffic incidents across Las Vegas — I'm routing responders and need to steer them clear of congestion.",
                bucket: 'clear-pass',
            },
            {
                title: 'blocked response corridors',
                description: 'Are any of our active response corridors currently blocked by secondary congestion?',
                bucket: 'clear-pass',
            },
            {
                title: 'multi-step plan',
                description:
                    "I'm planning responder coverage for tonight. Which areas of Las Vegas are most congested right now, and what's a good route around the worst one?",
                bucket: 'clear-pass',
            },
            {
                // HARD: future prediction the live data can't support — tempts fabrication.
                title: 'predict future congestion',
                description:
                    'Predict which corridors in Las Vegas will be the most congested five hours from now so I can pre-stage units there.',
                bucket: 'clear-fail',
            },
            {
                title: 'response route',
                description:
                    'Plan a response route from the fire station on W Charleston Blvd, Las Vegas to the Fremont Street Experience avoiding the current congestion.',
                bucket: 'clear-pass',
            },
            {
                title: 'conditions along route',
                description:
                    'What incidents and queues are along the route from W Charleston Blvd, Las Vegas to the Fremont Street Experience right now?',
                bucket: 'partial',
            },
            {
                title: 'alternative if blocked',
                description:
                    'If the direct route to the Fremont Street Experience is blocked right now, what is the best alternative?',
                bucket: 'partial',
            },
            {
                title: 'incident proximity',
                description:
                    'Are there any traffic incidents within 1 km of the Las Vegas Strip at Flamingo Rd right now?',
                bucket: 'clear-pass',
            },
            {
                title: 'blocked corridors',
                description: 'Which corridors into Downtown Las Vegas are currently blocked?',
                bucket: 'partial',
            },
            {
                title: 'clear hospital route',
                description:
                    'What is the clearest current route from Harry Reid International Airport to Sunrise Hospital on S Maryland Pkwy, Las Vegas avoiding congestion?',
                bucket: 'clear-pass',
            },
        ],
    },
];
