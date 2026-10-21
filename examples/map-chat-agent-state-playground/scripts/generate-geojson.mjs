// Generates three synthetic POI GeoJSON datasets that conform to the SDK `Place` shape:
//   - london.geojson      (100k points,  dense urban hotspots)
//   - california.geojson  (500k points,  nature / scenic hotspots)
//   - amsterdam.geojson   ( 10k points,  restaurants by cuisine)
//
// Output: examples/map-chat-agent-state-playground/src/public/data/*.geojson
// Served at `/data/<file>.geojson` by Vite (root: ./src, publicDir: ./src/public).
//
// Run:  node scripts/generate-geojson.mjs
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'src', 'public', 'data');

// --- deterministic PRNG + gaussian ---
function mulberry32(seed) {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function gauss(rng) {
    const u1 = Math.max(rng(), 1e-10);
    const u2 = rng();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
function pickWeighted(rng, items) {
    const wOf = (it) => it.weight ?? it.w;
    const total = items.reduce((a, b) => a + wOf(b), 0);
    let r = rng() * total;
    for (const it of items) {
        r -= wOf(it);
        if (r <= 0) return it;
    }
    return items[items.length - 1];
}
function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
}

function localize(category) {
    return category.toLowerCase().replace(/_/g, ' ');
}

// --- hotspots ---
// weight = relative concentration, sigma = [lngSigma, latSigma] in degrees
const LONDON_HOTSPOTS = [
    { name: 'The City', lng: -0.0922, lat: 51.5155, sigma: [0.012, 0.01], weight: 10 },
    { name: 'West End / Soho', lng: -0.1345, lat: 51.5139, sigma: [0.01, 0.008], weight: 12 },
    { name: 'Covent Garden', lng: -0.124, lat: 51.5117, sigma: [0.008, 0.006], weight: 8 },
    { name: 'Shoreditch', lng: -0.0775, lat: 51.5265, sigma: [0.01, 0.008], weight: 7 },
    { name: 'Camden', lng: -0.146, lat: 51.5412, sigma: [0.01, 0.009], weight: 6 },
    { name: 'Kensington', lng: -0.1749, lat: 51.4988, sigma: [0.012, 0.009], weight: 6 },
    { name: 'Notting Hill', lng: -0.2057, lat: 51.5091, sigma: [0.01, 0.008], weight: 4 },
    { name: 'Islington', lng: -0.103, lat: 51.538, sigma: [0.01, 0.009], weight: 5 },
    { name: 'Southwark', lng: -0.0877, lat: 51.5045, sigma: [0.01, 0.008], weight: 5 },
    { name: 'Canary Wharf', lng: -0.0235, lat: 51.505, sigma: [0.01, 0.008], weight: 5 },
    { name: 'Chelsea', lng: -0.1708, lat: 51.4876, sigma: [0.01, 0.008], weight: 4 },
    { name: 'Paddington', lng: -0.1755, lat: 51.5154, sigma: [0.01, 0.008], weight: 4 },
    { name: 'Holborn', lng: -0.119, lat: 51.5174, sigma: [0.008, 0.006], weight: 6 },
    { name: "King's Cross", lng: -0.1238, lat: 51.5308, sigma: [0.01, 0.008], weight: 5 },
    { name: 'Hammersmith', lng: -0.2237, lat: 51.492, sigma: [0.012, 0.01], weight: 3 },
    { name: 'Greenwich', lng: -0.0098, lat: 51.4826, sigma: [0.014, 0.01], weight: 3 },
];

const CALIFORNIA_HOTSPOTS = [
    { name: 'Yosemite Valley', lng: -119.5936, lat: 37.7459, sigma: [0.18, 0.14], weight: 14 },
    { name: 'Joshua Tree NP', lng: -115.901, lat: 33.8734, sigma: [0.25, 0.18], weight: 10 },
    { name: 'Redwood NP', lng: -124.0046, lat: 41.2132, sigma: [0.2, 0.22], weight: 8 },
    { name: 'Sequoia NP', lng: -118.5658, lat: 36.4864, sigma: [0.18, 0.15], weight: 8 },
    { name: 'Kings Canyon NP', lng: -118.6814, lat: 36.8879, sigma: [0.17, 0.14], weight: 6 },
    { name: 'Lake Tahoe', lng: -120.0324, lat: 39.0968, sigma: [0.18, 0.15], weight: 10 },
    { name: 'Big Sur', lng: -121.8081, lat: 36.2704, sigma: [0.14, 0.22], weight: 8 },
    { name: 'Death Valley NP', lng: -117.0794, lat: 36.5054, sigma: [0.3, 0.3], weight: 7 },
    { name: 'Point Reyes', lng: -122.8815, lat: 38.0723, sigma: [0.14, 0.12], weight: 5 },
    { name: 'Channel Islands', lng: -119.7785, lat: 34.0069, sigma: [0.14, 0.12], weight: 4 },
    { name: 'Lassen Volcanic NP', lng: -121.4207, lat: 40.4977, sigma: [0.18, 0.15], weight: 5 },
    { name: 'Mount Shasta', lng: -122.1949, lat: 41.4099, sigma: [0.16, 0.14], weight: 6 },
    { name: 'Mojave NP', lng: -115.6359, lat: 35.0714, sigma: [0.3, 0.25], weight: 5 },
    { name: 'Pinnacles NP', lng: -121.1825, lat: 36.4906, sigma: [0.12, 0.1], weight: 4 },
    { name: 'Mono Lake', lng: -119.0131, lat: 38.0017, sigma: [0.15, 0.12], weight: 5 },
    { name: 'Sonoma Valley', lng: -122.4604, lat: 38.3099, sigma: [0.14, 0.12], weight: 4 },
    { name: 'Muir Woods', lng: -122.5712, lat: 37.8963, sigma: [0.08, 0.08], weight: 4 },
    { name: 'Lake Shasta', lng: -122.3166, lat: 40.7255, sigma: [0.18, 0.15], weight: 5 },
    { name: 'Anza-Borrego', lng: -116.3753, lat: 33.2553, sigma: [0.25, 0.22], weight: 4 },
    { name: 'San Bernardino Forest', lng: -117.1069, lat: 34.2257, sigma: [0.22, 0.18], weight: 5 },
    { name: 'Los Padres Forest', lng: -120.45, lat: 35.05, sigma: [0.28, 0.25], weight: 5 },
    { name: 'Mendocino Coast', lng: -123.7951, lat: 39.3077, sigma: [0.14, 0.2], weight: 4 },
    { name: 'Trinity Alps', lng: -122.902, lat: 40.9946, sigma: [0.22, 0.18], weight: 4 },
    { name: 'Sierra Crest', lng: -118.9, lat: 37.3, sigma: [0.25, 0.3], weight: 6 },
];

const AMSTERDAM_HOTSPOTS = [
    { name: 'Grachtengordel', lng: 4.892, lat: 52.373, sigma: [0.004, 0.003], weight: 16 },
    { name: 'De Pijp', lng: 4.894, lat: 52.3555, sigma: [0.004, 0.003], weight: 12 },
    { name: 'Jordaan', lng: 4.8833, lat: 52.374, sigma: [0.003, 0.003], weight: 11 },
    { name: 'Oud-West', lng: 4.87, lat: 52.3653, sigma: [0.004, 0.003], weight: 8 },
    { name: 'Museumplein', lng: 4.881, lat: 52.358, sigma: [0.004, 0.003], weight: 7 },
    { name: 'De Wallen', lng: 4.8987, lat: 52.374, sigma: [0.003, 0.002], weight: 8 },
    { name: 'Westerpark', lng: 4.8793, lat: 52.3853, sigma: [0.004, 0.003], weight: 6 },
    { name: 'Noord', lng: 4.9011, lat: 52.387, sigma: [0.006, 0.005], weight: 5 },
    { name: 'Oost', lng: 4.93, lat: 52.3597, sigma: [0.005, 0.004], weight: 6 },
    { name: 'Leidseplein', lng: 4.8839, lat: 52.3638, sigma: [0.003, 0.002], weight: 7 },
    { name: 'Nieuwmarkt', lng: 4.9003, lat: 52.3723, sigma: [0.003, 0.002], weight: 5 },
    { name: 'Rembrandtplein', lng: 4.8961, lat: 52.366, sigma: [0.003, 0.002], weight: 5 },
    { name: 'Plantage', lng: 4.9108, lat: 52.3665, sigma: [0.004, 0.003], weight: 4 },
    { name: 'Oud-Zuid', lng: 4.868, lat: 52.3505, sigma: [0.005, 0.004], weight: 5 },
];

// --- category pools ---
const LONDON_CATEGORIES = [
    { cat: 'CAFE', w: 8 },
    { cat: 'COFFEE_SHOP', w: 7 },
    { cat: 'RESTAURANT', w: 10 },
    { cat: 'ITALIAN_RESTAURANT', w: 5 },
    { cat: 'INDIAN_RESTAURANT', w: 5 },
    { cat: 'CHINESE_RESTAURANT', w: 3 },
    { cat: 'JAPANESE_RESTAURANT', w: 3 },
    { cat: 'PUB', w: 9 },
    { cat: 'BAR', w: 5 },
    { cat: 'COCKTAIL_BAR', w: 2 },
    { cat: 'BAKERY', w: 4 },
    { cat: 'HOTEL', w: 4 },
    { cat: 'MALL', w: 2 },
    { cat: 'CLOTHING_SHOP', w: 5 },
    { cat: 'BOOK_SHOP', w: 2 },
    { cat: 'PHARMACY', w: 4 },
    { cat: 'MUSEUM', w: 2 },
    { cat: 'THEATER', w: 2 },
    { cat: 'PARK', w: 3 },
    { cat: 'CINEMA', w: 2 },
    { cat: 'GROCERY_STORE', w: 6 },
    { cat: 'FAST_FOOD', w: 5 },
    { cat: 'PIZZERIA', w: 4 },
    { cat: 'SUPERMARKET', w: 3 },
    { cat: 'TOURIST_ATTRACTION', w: 3 },
    { cat: 'RAILWAY_STATION', w: 1 },
    { cat: 'SUBWAY_STATION', w: 3 },
    { cat: 'BANK', w: 4 },
    { cat: 'ATM', w: 5 },
    { cat: 'HOSPITAL', w: 1 },
    { cat: 'FUEL_STATION', w: 2 },
    { cat: 'GYM_FITNESS_CENTER', w: 0 },
    { cat: 'FITNESS_CLUB_AND_CENTER', w: 3 },
    { cat: 'HAIRDRESSER', w: 4 },
    { cat: 'MOBILE_PHONE_SHOP', w: 2 },
    { cat: 'NIGHTLIFE', w: 2 },
    { cat: 'ICE_CREAM_PARLOR', w: 2 },
    { cat: 'SANDWICH_RESTAURANT', w: 3 },
].filter((c) => c.w > 0);

const CALIFORNIA_NATURE_CATEGORIES = [
    { cat: 'PARK', w: 10 },
    { cat: 'PARK_AND_RECREATION_AREA', w: 10 },
    { cat: 'FOREST_AREA', w: 9 },
    { cat: 'NATURAL_TOURIST_ATTRACTION', w: 10 },
    { cat: 'WILDERNESS_AREA', w: 8 },
    { cat: 'VIEWPOINT', w: 12 },
    { cat: 'HIKING_TRAIL', w: 14 },
    { cat: 'MOUNTAIN_PEAK', w: 7 },
    { cat: 'MOUNTAIN_PASS', w: 4 },
    { cat: 'BEACH', w: 6 },
    { cat: 'CAVE', w: 3 },
    { cat: 'WILDLIFE_PARK', w: 4 },
    { cat: 'CAMPING_GROUND', w: 8 },
    { cat: 'RECREATIONAL_CAMPING_GROUND', w: 6 },
    { cat: 'RECREATION_AREA', w: 7 },
    { cat: 'PROTECTED_LAND', w: 6 },
    { cat: 'HISTORICAL_PARK', w: 4 },
    { cat: 'HISTORIC_SITE', w: 4 },
    { cat: 'RESERVOIR', w: 4 },
    { cat: 'TRAIL_SYSTEM', w: 6 },
    { cat: 'PICNIC_AREA', w: 7 },
    { cat: 'DUNE', w: 2 },
    { cat: 'HILL', w: 5 },
    { cat: 'VALLEY', w: 4 },
    { cat: 'PLATEAU', w: 2 },
    { cat: 'ROCKS', w: 4 },
    { cat: 'ROCK_CLIMBING_TRAIL', w: 4 },
    { cat: 'MOUNTAIN_BIKE_TRAIL', w: 5 },
    { cat: 'ADVENTURE_SPORTS_FACILITY', w: 3 },
    { cat: 'HORSE_RIDING_TRAIL', w: 3 },
    { cat: 'FISHING_AND_HUNTING_AREA', w: 4 },
    { cat: 'SKI_RESORT', w: 3 },
    { cat: 'TOURIST_ATTRACTION', w: 5 },
    { cat: 'ARBORETA_AND_BOTANICAL_GARDENS', w: 2 },
    { cat: 'ZOOS_ARBORETA_BOTANICAL_GARDEN', w: 2 },
    { cat: 'MARINA', w: 2 },
    { cat: 'BAY', w: 2 },
    { cat: 'CAPE', w: 2 },
    { cat: 'ISLAND', w: 1 },
    { cat: 'REEF', w: 1 },
    { cat: 'RAPIDS', w: 2 },
    { cat: 'WATER_HOLE', w: 2 },
    { cat: 'NATURAL_FEATURE', w: 3 },
];

const AMSTERDAM_RESTAURANT_CATEGORIES = [
    { cat: 'DUTCH_RESTAURANT', w: 10 },
    { cat: 'ITALIAN_RESTAURANT', w: 12 },
    { cat: 'INDONESIAN_RESTAURANT', w: 9 },
    { cat: 'JAPANESE_RESTAURANT', w: 8 },
    { cat: 'INDIAN_RESTAURANT', w: 7 },
    { cat: 'MEXICAN_RESTAURANT', w: 5 },
    { cat: 'CHINESE_RESTAURANT', w: 7 },
    { cat: 'THAI_RESTAURANT', w: 6 },
    { cat: 'MIDDLE_EASTERN_RESTAURANT', w: 5 },
    { cat: 'MEDITERRANEAN_RESTAURANT', w: 6 },
    { cat: 'TURKISH_RESTAURANT', w: 5 },
    { cat: 'VIETNAMESE_RESTAURANT', w: 5 },
    { cat: 'SUSHI_RESTAURANT', w: 7 },
    { cat: 'GREEK_RESTAURANT', w: 4 },
    { cat: 'KOREAN_RESTAURANT', w: 4 },
    { cat: 'VEGETARIAN_RESTAURANT', w: 5 },
    { cat: 'FRENCH_RESTAURANT', w: 5 },
    { cat: 'ETHIOPIAN_RESTAURANT', w: 2 },
    { cat: 'LEBANESE_RESTAURANT', w: 3 },
    { cat: 'SPANISH_RESTAURANT', w: 4 },
    { cat: 'MOROCCAN_RESTAURANT', w: 3 },
    { cat: 'CAFE', w: 8 },
    { cat: 'COFFEE_SHOP', w: 6 },
    { cat: 'PIZZERIA', w: 7 },
    { cat: 'BISTRO', w: 5 },
    { cat: 'SEAFOOD', w: 4 },
    { cat: 'STEAK_HOUSE', w: 3 },
    { cat: 'BAR', w: 6 },
    { cat: 'FAST_FOOD', w: 5 },
    { cat: 'HAMBURGER_RESTAURANT', w: 4 },
    { cat: 'TAPAS_RESTAURANT', w: 4 },
    { cat: 'FUSION_RESTAURANT', w: 3 },
    { cat: 'ORGANIC_FOOD_RESTAURANT', w: 3 },
    { cat: 'SNACKS_RESTAURANT', w: 3 },
    { cat: 'PUB', w: 4 },
    { cat: 'SANDWICH_RESTAURANT', w: 3 },
    { cat: 'ICE_CREAM_PARLOR', w: 3 },
    { cat: 'BAKERY', w: 4 },
];

// --- name generators ---
const LONDON_FIRST = [
    "The Queen's",
    'The Royal',
    'The Crown',
    'Covent',
    'Soho',
    'Mayfair',
    'Camden',
    'Kensington',
    'Chelsea',
    'Greenwich',
    'Holborn',
    'Borough',
    'Fleet Street',
    "St. James's",
    'Westminster',
    'Piccadilly',
    'Baker Street',
    'Oxford',
    'Bond Street',
    'Victoria',
    'Albion',
    'Britannia',
    'Thames',
    'Tower',
    'Covent Garden',
    'Portobello',
];
const LONDON_SUFFIX = { generic: ['House', 'Place', 'Corner', '& Co.', 'Market', 'Yard', 'Bros', 'Works', 'Rooms'] };

const US_FIRST = [
    'Eagle',
    'Pine',
    'Cedar',
    'Granite',
    'Silver',
    'Golden',
    'Whispering',
    'Crystal',
    'Tall Pine',
    'Twin Lakes',
    'Lost Creek',
    'High Sierra',
    'Redwood',
    'Ponderosa',
    'Bear',
    'Coyote',
    'Falcon',
    'Wildhorse',
    'Serenity',
    'Sunset',
    'Sunrise',
    'Cascade',
    'Summit',
    'Big Sur',
    'Valley',
    'Skyline',
    'Alpine',
    'Blue Oak',
    'Mariposa',
    'Sequoia',
    'Yucca',
    'Mojave',
    'Sierra',
    'Pacific',
    'Condor',
    'Osprey',
    'Wildflower',
    'Juniper',
    'Manzanita',
    'Sagebrush',
];
const US_SUFFIX = {
    HIKING_TRAIL: ['Trail', 'Trailhead', 'Loop Trail', 'Path'],
    TRAIL_SYSTEM: ['Trail System', 'Trail Network'],
    MOUNTAIN_BIKE_TRAIL: ['Bike Trail', 'MTB Loop'],
    ROCK_CLIMBING_TRAIL: ['Climbing Route', 'Rock Route'],
    HORSE_RIDING_TRAIL: ['Equestrian Trail', 'Horse Trail'],
    CAMPING_GROUND: ['Campground', 'Camp', 'Tent Sites'],
    RECREATIONAL_CAMPING_GROUND: ['RV Camp', 'Campground'],
    MOUNTAIN_PEAK: ['Peak', 'Summit', 'Mountain'],
    MOUNTAIN_PASS: ['Pass', 'Gap', 'Saddle'],
    VIEWPOINT: ['Vista Point', 'Overlook', 'Viewpoint', 'Lookout'],
    PICNIC_AREA: ['Picnic Area', 'Picnic Grounds'],
    PARK: ['Park', 'State Park', 'County Park'],
    PARK_AND_RECREATION_AREA: ['Recreation Area', 'Rec Area'],
    RECREATION_AREA: ['Recreation Area'],
    FOREST_AREA: ['Grove', 'Forest', 'Woods'],
    WILDERNESS_AREA: ['Wilderness', 'Wild Area'],
    WILDLIFE_PARK: ['Wildlife Reserve', 'Preserve'],
    NATURAL_TOURIST_ATTRACTION: ['Natural Wonder', 'Natural Landmark'],
    PROTECTED_LAND: ['Preserve', 'Conservation Area'],
    HISTORICAL_PARK: ['Historical Park', 'Heritage Park'],
    HISTORIC_SITE: ['Historic Site', 'Landmark'],
    RESERVOIR: ['Reservoir', 'Lake'],
    CAVE: ['Cave', 'Cavern', 'Grotto'],
    DUNE: ['Dunes', 'Dune Field'],
    HILL: ['Hill', 'Rise', 'Knoll'],
    VALLEY: ['Valley', 'Canyon'],
    PLATEAU: ['Plateau', 'Mesa'],
    ROCKS: ['Rocks', 'Boulders', 'Crags'],
    BEACH: ['Beach', 'Cove'],
    BAY: ['Bay', 'Inlet'],
    CAPE: ['Point', 'Cape'],
    ISLAND: ['Island', 'Isle'],
    REEF: ['Reef'],
    RAPIDS: ['Rapids'],
    MARINA: ['Marina', 'Boat Harbor'],
    WATER_HOLE: ['Spring', 'Pool'],
    NATURAL_FEATURE: ['Landmark', 'Formation'],
    SKI_RESORT: ['Ski Resort', 'Mountain Resort'],
    ADVENTURE_SPORTS_FACILITY: ['Adventure Park', 'Sports Center'],
    FISHING_AND_HUNTING_AREA: ['Fishing Area', 'Hunting Grounds'],
    ARBORETA_AND_BOTANICAL_GARDENS: ['Arboretum', 'Botanical Garden'],
    ZOOS_ARBORETA_BOTANICAL_GARDEN: ['Zoo', 'Garden'],
    TOURIST_ATTRACTION: ['Visitor Point', 'Attraction'],
};

const NL_FIRST_RESTAURANT = [
    'De Gouden',
    'De Witte',
    'De Rode',
    'De Groene',
    'De Oude',
    'Het Blauwe',
    'Het Kleine',
    'Het Grote',
    "'t Gouden",
    "'t Oude",
    'Gracht',
    'Keizer',
    'Prinsen',
    'Koninklijke',
    'Bella',
    'Trattoria',
    'Osteria',
    'Sakura',
    'Tokyo',
    'Kyoto',
    'Fuji',
    'Taj',
    'Mumbai',
    'Bombay',
    'El Gaucho',
    'La Casa',
    'Casa',
    'Le Bistro',
    'Chez',
    'Maison',
    'Saigon',
    'Hanoi',
    'Bangkok',
    'Chiang',
    'Golden Dragon',
    'Golden Pagoda',
    'Seoul',
    'Busan',
    'Byblos',
    'Jerusalem',
    'Istanbul',
    'Anatolia',
    'Athena',
    'Santorini',
    'Casablanca',
    'Marrakech',
    'Addis',
    'Habesha',
    'Barcelona',
    'Madrid',
    'Olive',
    'Basil',
    'Rosemary',
    'Lemon',
    'Green Table',
    'Farm',
    'Harvest',
    'Market',
    'Canal',
    'Jordaan',
];

const NL_SUFFIX = {
    DUTCH_RESTAURANT: ['Kroeg', 'Eetcafé', 'Brasserie', 'Keuken', 'Herberg'],
    ITALIAN_RESTAURANT: ['Ristorante', 'Trattoria', 'Osteria', 'Cucina'],
    INDONESIAN_RESTAURANT: ['Rijsttafel', 'Warung', 'Rumah Makan'],
    JAPANESE_RESTAURANT: ['Japanese', 'Izakaya', 'Ramen House'],
    INDIAN_RESTAURANT: ['Indian', 'Curry House', 'Tandoori'],
    MEXICAN_RESTAURANT: ['Mexican', 'Cantina', 'Taqueria'],
    CHINESE_RESTAURANT: ['Chinese', 'Wok', 'Dragon'],
    THAI_RESTAURANT: ['Thai', 'Thai Kitchen'],
    MIDDLE_EASTERN_RESTAURANT: ['Middle Eastern', 'Mezze', 'Shawarma'],
    MEDITERRANEAN_RESTAURANT: ['Mediterranean', 'Mezze'],
    TURKISH_RESTAURANT: ['Turkish', 'Lokanta', 'Kebab House'],
    VIETNAMESE_RESTAURANT: ['Vietnamese', 'Pho', 'Banh Mi'],
    SUSHI_RESTAURANT: ['Sushi', 'Sushi Bar', 'Sushi House'],
    GREEK_RESTAURANT: ['Greek', 'Taverna', 'Gyros House'],
    KOREAN_RESTAURANT: ['Korean BBQ', 'Korean Kitchen'],
    VEGETARIAN_RESTAURANT: ['Vegetarian', 'Plant Kitchen', 'Green Kitchen'],
    FRENCH_RESTAURANT: ['French', 'Bistro', 'Brasserie'],
    ETHIOPIAN_RESTAURANT: ['Ethiopian', 'Injera House'],
    LEBANESE_RESTAURANT: ['Lebanese', 'Mezza'],
    SPANISH_RESTAURANT: ['Spanish', 'Tapas Bar'],
    MOROCCAN_RESTAURANT: ['Moroccan', 'Tagine'],
    CAFE: ['Café', 'Koffiehuis', 'Kafé'],
    COFFEE_SHOP: ['Coffee', 'Espresso Bar'],
    PIZZERIA: ['Pizzeria', 'Pizza'],
    BISTRO: ['Bistro', 'Eetcafé'],
    SEAFOOD: ['Seafood', 'Fish House', 'Oyster Bar'],
    STEAK_HOUSE: ['Steakhouse', 'Grill'],
    BAR: ['Bar', 'Lounge'],
    FAST_FOOD: ['Diner', 'Snackbar'],
    HAMBURGER_RESTAURANT: ['Burger', 'Burger Joint'],
    TAPAS_RESTAURANT: ['Tapas', 'Tapas Bar'],
    FUSION_RESTAURANT: ['Fusion Kitchen', 'Fusion'],
    ORGANIC_FOOD_RESTAURANT: ['Organic Kitchen', 'Farm Table'],
    SNACKS_RESTAURANT: ['Snackbar', 'Friterie'],
    PUB: ['Pub', 'Brown Café'],
    SANDWICH_RESTAURANT: ['Broodjes', 'Sandwich Bar'],
    ICE_CREAM_PARLOR: ['IJssalon', 'Gelateria'],
    BAKERY: ['Bakkerij', 'Bakery'],
};

function londonName(rng, _hotspot, category) {
    const first = pick(rng, LONDON_FIRST);
    if (category === 'PUB' || category === 'BAR' || category === 'COCKTAIL_BAR') {
        return `The ${first.replace(/^The\s+/, '')}`;
    }
    if (category.endsWith('_RESTAURANT') || category === 'RESTAURANT') {
        return `${first} Kitchen`;
    }
    if (category === 'CAFE' || category === 'COFFEE_SHOP') return `${first} Coffee`;
    if (category === 'BAKERY') return `${first} Bakery`;
    if (category === 'HOTEL') return `${first} Hotel`;
    if (category === 'PARK') return `${first} Park`;
    if (category === 'RAILWAY_STATION' || category === 'SUBWAY_STATION') return `${first} Station`;
    return `${first} ${pick(rng, LONDON_SUFFIX.generic)}`;
}

function californiaName(rng, hotspot, category) {
    const first = pick(rng, US_FIRST);
    const suffixes = US_SUFFIX[category] ?? ['Area', 'Point'];
    const suffix = pick(rng, suffixes);
    // 40% chance to prefix with the hotspot name for flavor
    if (rng() < 0.4) return `${hotspot.name} ${first} ${suffix}`;
    return `${first} ${suffix}`;
}

function amsterdamName(rng, _hotspot, category) {
    const first = pick(rng, NL_FIRST_RESTAURANT);
    const suffixes = NL_SUFFIX[category] ?? ['Restaurant'];
    return `${first} ${pick(rng, suffixes)}`;
}

// --- generation ---
async function generate({
    file,
    count,
    hotspots,
    categories,
    region,
    countryCode,
    countryName,
    countryISO3,
    subdivision,
    idPrefix,
    nameFn,
    rngSeed,
    progressEvery,
}) {
    const rng = mulberry32(rngSeed);
    const out = createWriteStream(file, { highWaterMark: 1 << 20 });
    let written = 0;
    const write = (chunk) =>
        new Promise((resolve) => {
            if (!out.write(chunk)) out.once('drain', resolve);
            else resolve();
        });

    const header = `{"type":"FeatureCollection","name":"${region}","features":[\n`;
    await write(header);

    const minLngMajor = Math.min(...hotspots.map((h) => h.lng - h.sigma[0] * 4));
    const maxLngMajor = Math.max(...hotspots.map((h) => h.lng + h.sigma[0] * 4));
    const minLatMajor = Math.min(...hotspots.map((h) => h.lat - h.sigma[1] * 4));
    const maxLatMajor = Math.max(...hotspots.map((h) => h.lat + h.sigma[1] * 4));

    for (let i = 0; i < count; i++) {
        const hotspot = pickWeighted(rng, hotspots);
        const lng = hotspot.lng + gauss(rng) * hotspot.sigma[0];
        const lat = hotspot.lat + gauss(rng) * hotspot.sigma[1];
        // clamp to the overall area to avoid outliers
        const lngC = Math.max(minLngMajor, Math.min(maxLngMajor, lng));
        const latC = Math.max(minLatMajor, Math.min(maxLatMajor, lat));

        const catEntry = pickWeighted(rng, categories);
        const category = catEntry.cat;
        const name = nameFn(rng, hotspot, category);

        const feature = {
            type: 'Feature',
            id: `${idPrefix}-${i + 1}`,
            geometry: { type: 'Point', coordinates: [Number(lngC.toFixed(6)), Number(latC.toFixed(6))] },
            properties: {
                type: 'POI',
                address: {
                    freeformAddress: `${hotspot.name}, ${subdivision}, ${countryName}`,
                    municipality: hotspot.name,
                    countrySubdivision: subdivision,
                    countryCode,
                    country: countryName,
                    countryCodeISO3: countryISO3,
                },
                poi: {
                    name,
                    categories: [category],
                    localizedCategories: [localize(category)],
                },
            },
        };

        const prefix = i === 0 ? '' : ',\n';
        await write(prefix + JSON.stringify(feature));
        written++;
        if (progressEvery && written % progressEvery === 0) {
            process.stdout.write(`\r  ${region}: ${written.toLocaleString()}/${count.toLocaleString()}`);
        }
    }
    await write('\n]}\n');
    await new Promise((res) => out.end(res));
    if (progressEvery) process.stdout.write(`\r  ${region}: ${written.toLocaleString()}/${count.toLocaleString()}\n`);
}

async function main() {
    await mkdir(OUT_DIR, { recursive: true });
    const t0 = Date.now();

    console.log('Generating london.geojson (100k urban POIs)…');
    await generate({
        file: join(OUT_DIR, 'london.geojson'),
        count: 100_000,
        hotspots: LONDON_HOTSPOTS,
        categories: LONDON_CATEGORIES,
        region: 'London',
        countryCode: 'GB',
        countryName: 'United Kingdom',
        countryISO3: 'GBR',
        subdivision: 'England',
        idPrefix: 'ldn',
        nameFn: londonName,
        rngSeed: 1 + 42,
        progressEvery: 10_000,
    });

    console.log('Generating amsterdam.geojson (10k restaurants)…');
    await generate({
        file: join(OUT_DIR, 'amsterdam.geojson'),
        count: 10_000,
        hotspots: AMSTERDAM_HOTSPOTS,
        categories: AMSTERDAM_RESTAURANT_CATEGORIES,
        region: 'Amsterdam',
        countryCode: 'NL',
        countryName: 'Netherlands',
        countryISO3: 'NLD',
        subdivision: 'North Holland',
        idPrefix: 'ams',
        nameFn: amsterdamName,
        rngSeed: 7 + 99,
        progressEvery: 2_000,
    });

    console.log('Generating california.geojson (500k nature/scenic POIs)…');
    await generate({
        file: join(OUT_DIR, 'california.geojson'),
        count: 500_000,
        hotspots: CALIFORNIA_HOTSPOTS,
        categories: CALIFORNIA_NATURE_CATEGORIES,
        region: 'California',
        countryCode: 'US',
        countryName: 'United States',
        countryISO3: 'USA',
        subdivision: 'California',
        idPrefix: 'ca',
        nameFn: californiaName,
        rngSeed: 13 + 1337,
        progressEvery: 25_000,
    });

    console.log(`Done in ${((Date.now() - t0) / 1000).toFixed(1)}s → ${OUT_DIR}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
