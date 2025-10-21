import type { MapStylePOICategory } from '../places';

export const poiCategoryGroups: Record<string, MapStylePOICategory[]> = {
    FOOD_DRINKS_GROUP: [
        'RESTAURANT',
        'FAST_FOOD',
        'CAFE_PUB',
        'PUB',
        'WINERY',
        'PUB_FOOD',
        'SOUL_FOOD',
        'DELICATESSEN',
    ],
    SHOPPING_GROUP: [
        'SHOP',
        'SHOPPING_CENTER',
        'CLOTHING_SHOP',
        'MARKET',
        'FOOD_MARKET',
        'SUPERMARKETS_HYPERMARKETS',
        'DEPARTMENT_STORE',
        'CONVENIENCE_STORE',
        'GROCERY_STORE',
        'HARDWARE_STORE',
        'ELECTRICAL_APPLIANCES_SHOP',
    ],
    TRANSPORTATION_GROUP: [
        'AIRPORT',
        'FERRY_TERMINAL',
        'HELIPAD_HELICOPTER_LANDING',
        'PUBLIC_TRANSPORT_STOP',
        'RAILWAY_STATION',
        'BUS_STOP',
        'TAXI_STAND',
    ],
    HEALTH_GROUP: [
        'DOCTOR',
        'EMERGENCY_MEDICAL_SERVICE',
        'EMERGENCY_ROOM',
        'HEALTH_CARE_SERVICE',
        'HOSPITAL',
        'HOSPITAL_POLYCLINIC',
        'PHARMACY',
        'DENTIST',
        'WELFARE_ORGANIZATION',
    ],
    PARKING_GROUP: ['PARKING_GARAGE', 'OPEN_PARKING_AREA'],
    HOLIDAY_TOURISM_GROUP: [
        'AMUSEMENT_PARK',
        'BEACH',
        'HOLIDAY_RENTAL',
        'GEOGRAPHIC_FEATURE',
        'IMPORTANT_TOURIST_ATTRACTION',
        'LEISURE_CENTER',
        'MOUNTAIN_PASS',
        'MOUNTAIN_PEAK',
        'MUSEUM',
        'SCENIC_PANORAMIC_VIEW',
        'TOURIST_INFORMATION_OFFICE',
    ],
    EV_CHARGING_STATIONS_GROUP: ['ELECTRIC_VEHICLE_STATION'],
    GAS_STATIONS_GROUP: ['GAS_STATION', 'PETROL_STATION'],
    ACCOMMODATION_GROUP: ['CAMPING_GROUND', 'HOTEL_MOTEL', 'HOLIDAY_RENTAL'],
    ENTERTAINMENT_GROUP: [
        'CINEMA',
        'THEATER',
        'MOVIE_THEATER',
        'NIGHTLIFE',
        'CONCERT_HALL',
        'ENTERTAINMENT',
        'CLUB_ASSOCIATION',
        'CASINO',
    ],
    SPORTS_LEISURE_GROUP: [
        'SPORTS_CENTER',
        'WATER_SPORT',
        'SWIMMING_POOL',
        'GOLF_COURSE',
        'STADIUM',
        'BEACH',
        'ICE_SKATING_RINK',
        'LEISURE_CENTER',
        'MOUNTAIN_PASS',
        'MOUNTAIN_PEAK',
    ],
    EDUCATION_GROUP: ['SCHOOL', 'COLLEGE_UNIVERSITY', 'LIBRARY', 'CULTURAL_CENTER'],
    GOVERNMENT_GROUP: ['GOVERNMENT_OFFICE', 'COURTHOUSE', 'EMBASSY', 'FIRE_STATION_BRIGADE', 'POLICE_STATION'],
};

/**
 * POI category group type.
 *
 * @remarks
 * Represents predefined groups of related POI categories for convenient filtering.
 * Each group contains multiple {@link MapStylePOICategory} values that share a common theme.
 *
 * Using category groups simplifies filtering by allowing you to show or hide
 * multiple related POI types with a single filter value.
 *
 * Available groups:
 * - `FOOD_GROUP` - Restaurants, cafes, fast food, etc.
 * - `ACCOMMODATION_GROUP` - Hotels, motels, camping, etc.
 * - `SHOPPING_GROUP` - Stores, malls, markets, etc.
 * - `TRANSPORT_GROUP` - Airports, train stations, bus stops, etc.
 * - `HEALTHCARE_GROUP` - Hospitals, clinics, pharmacies, etc.
 * - `ENTERTAINMENT_GROUP` - Theaters, cinemas, museums, etc.
 * - `SPORTS_GROUP` - Stadiums, gyms, sports facilities, etc.
 * - `SERVICES_GROUP` - Banks, ATMs, post offices, etc.
 * - `AUTOMOTIVE_GROUP` - Gas stations, parking, car services, etc.
 * - `EDUCATION_GROUP` - Schools, universities, libraries, etc.
 * - `GOVERNMENT_GROUP` - Government offices, embassies, police stations, etc.
 *
 * @example
 * ```ts
 * // Filter to show only food-related POIs
 * categoryFilter: { mode: 'show', values: ['FOOD_GROUP'] }
 * ```
 *
 * @see {@link MapStylePOICategory} - For individual POI categories
 *
 * @group POI
 */
export type POICategoryGroup = keyof typeof poiCategoryGroups;
