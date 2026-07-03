import type { Persona } from 'agent-eval';

export interface PersonaAndTasks {
    persona: Persona;
    tasks: { title: string; description: string }[];
}

export const qsrFranchiseScout: PersonaAndTasks = {
    persona: {
        name: 'QSR / Restaurant Franchise Scout',
        description:
            'Intermediate expertise in site selection and franchise operations. Speaks in terms of drive-time, candidate address, population catchment, competitor density, cannibalization, franchise territory. Typical phrasings: "Show me the 10-min drive time area around Marnixstraat at noon on a weekday.", "How many competing burger joints are there and where are they clustered?", "Does this site have enough drive-time population and not too much cannibalization from my other locations?"',
        goal: 'Validate reach, access & non-cannibalisation of a candidate.',
    },
    tasks: [
        {
            title: 'compare drive-time reach',
            description:
                'Show me the 10-minute drive-time catchment population for my three candidate addresses so I can compare reach.',
        },
    ],
};

export const retailExpansionManager: PersonaAndTasks = {
    persona: {
        name: 'Retail Expansion Manager',
        description:
            'Intermediate expertise in site selection and retail expansion. Speaks in terms of candidate sets, reach metrics, competition density, and ranking. Typical phrasings: "Rank these shortlisted sites by drive-time population.", "Which site has the least competition nearby?", "Why does site A beat site B on reach?"',
        goal: 'Compare shortlisted sites on reach & competition and see why one wins.',
    },
    tasks: [
        {
            title: 'competition density',
            description:
                'How much competition is around the Johan Cruiff Arena — how many clothing store competitors are nearby and where are they clustered?',
        },
    ],
};

export const creBroker: PersonaAndTasks = {
    persona: {
        name: 'CRE Broker',
        description:
            'Expert in commercial real estate, footfall analysis, and client-facing reporting. Speaks in terms of catchment population, footfall evidence, rent justification, and sourced summaries. Typical phrasings: "Give me a defensible catchment summary for this location.", "What evidence supports the footfall claim here?", "Summarise the competitive context for my client report."',
        goal: 'Justify footfall/rent claims with evidence and hand a client a sourced catchment + context summary.',
    },
    tasks: [
        {
            title: 'client-ready catchment',
            description:
                'Map the drive-time catchment around this location and the population it reaches — I need it client-ready.',
        },
    ],
};

export const evChargingPlanner: PersonaAndTasks = {
    persona: {
        name: 'EV Charging Planner',
        description:
            'Technical expertise in EV infrastructure planning. Speaks in terms of traffic volume, dwell time, road accessibility, and charger placement overlap. Typical phrasings: "Is this location busy enough and easy to reach?", "Are there other chargers within 5 km?", "Show me traffic flow and dwell patterns around this site."',
        goal: 'Place chargers where traffic & dwell warrant it and distinguish busy roads from accessible stops without overlap.',
    },
    tasks: [
        {
            title: 'traffic volume around site',
            description: "What's the traffic volume and intensity around the Johan Cruiff Area now?",
        },
    ],
};

export const logisticsLastMileLead: PersonaAndTasks = {
    persona: {
        name: 'Logistics / Last-Mile Lead',
        description:
            'Expert in depot site selection and last-mile logistics. Speaks in terms of service areas, drive times, vehicle mix, road profiles, and cost-reach trade-offs. Typical phrasings: "What is the 45-minute service area from this depot candidate?", "How does the road network look for heavy vehicles?", "Compare these two depot sites on reach vs cost."',
        goal: 'Pick depot sites balancing reach & cost and see service area + surrounding road profile in one pass.',
    },
    tasks: [
        {
            title: 'depot service area',
            description:
                'Show the 30-minute drive-time service area for these candidate depot addresses and how much each reaches.',
        },
    ],
};
