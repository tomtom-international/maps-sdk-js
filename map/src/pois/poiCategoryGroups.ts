import type { MapStylePOICategory } from '../places';

/**
 * Predefined groups of related POI categories for convenient filtering.
 *
 * @remarks
 * This object maps group names to arrays of {@link MapStylePOICategory} values.
 * Each group contains POI categories that share a common theme or purpose,
 * making it easier to filter multiple related POI types with a single identifier.
 *
 * **Available Groups:**
 * - `FOOD_DRINKS_GROUP` - Dining and beverage establishments (restaurants, cafes, pubs, etc.)
 * - `SHOPPING_GROUP` - Retail stores and shopping centers (shops, markets, supermarkets, etc.)
 * - `TRANSPORTATION_GROUP` - Transportation hubs and stops (airports, stations, terminals, etc.)
 * - `HEALTH_GROUP` - Healthcare facilities and services (hospitals, clinics, pharmacies, etc.)
 * - `PARKING_GROUP` - Parking facilities (garages and open parking areas)
 * - `HOLIDAY_TOURISM_GROUP` - Tourist attractions and recreational sites (museums, parks, beaches, etc.)
 * - `EV_CHARGING_STATIONS_GROUP` - Electric vehicle charging locations
 * - `GAS_STATIONS_GROUP` - Fuel stations for traditional vehicles
 * - `ACCOMMODATION_GROUP` - Lodging facilities (hotels, motels, camping grounds, etc.)
 * - `ENTERTAINMENT_GROUP` - Entertainment venues (cinemas, theaters, nightlife, casinos, etc.)
 * - `SPORTS_LEISURE_GROUP` - Sports and leisure facilities (stadiums, gyms, pools, golf courses, etc.)
 * - `EDUCATION_GROUP` - Educational institutions (schools, universities, libraries, etc.)
 * - `GOVERNMENT_GROUP` - Government and public safety facilities (offices, courts, embassies, police, fire stations)
 *
 * @example
 * Filter to show only food-related POIs:
 * ```ts
 * import { poiCategoryGroups } from '@tomtom-international/maps-sdk-js/map';
 *
 * const foodCategories = poiCategoryGroups.FOOD_DRINKS_GROUP;
 * console.log(foodCategories);
 * // ['RESTAURANT', 'FAST_FOOD', 'CAFE_PUB', 'PUB', 'WINERY', ...]
 * ```
 *
 * @example
 * Use with POI module filtering:
 * ```ts
 * poisModule.configure({
 *   categoryFilter: {
 *     mode: 'show',
 *     values: ['FOOD_DRINKS_GROUP', 'ENTERTAINMENT_GROUP']
 *   }
 * });
 * ```
 *
 * @see {@link POICategoryGroup} - Type representing all available group names
 * @see {@link MapStylePOICategory} - Individual POI category identifiers
 *
 * @group POIs
 */
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
 * **Available groups:**
 * - `FOOD_DRINKS_GROUP` - Restaurants, cafes, fast food, wineries, etc.
 * - `SHOPPING_GROUP` - Stores, malls, markets, supermarkets, etc.
 * - `TRANSPORTATION_GROUP` - Airports, train stations, bus stops, ferry terminals, etc.
 * - `HEALTH_GROUP` - Hospitals, clinics, pharmacies, doctors, dentists, etc.
 * - `PARKING_GROUP` - Parking garages and open parking areas
 * - `HOLIDAY_TOURISM_GROUP` - Tourist attractions, museums, beaches, scenic views, etc.
 * - `EV_CHARGING_STATIONS_GROUP` - Electric vehicle charging stations
 * - `GAS_STATIONS_GROUP` - Gas and petrol stations
 * - `ACCOMMODATION_GROUP` - Hotels, motels, camping grounds, etc.
 * - `ENTERTAINMENT_GROUP` - Cinemas, theaters, nightlife, casinos, etc.
 * - `SPORTS_LEISURE_GROUP` - Stadiums, sports centers, swimming pools, golf courses, etc.
 * - `EDUCATION_GROUP` - Schools, universities, libraries, cultural centers
 * - `GOVERNMENT_GROUP` - Government offices, courthouses, embassies, police, fire stations
 *
 * @example
 * Filter to show only food-related POIs:
 * ```ts
 * poisModule.configure({
 *   categoryFilter: {
 *     mode: 'show',
 *     values: ['FOOD_DRINKS_GROUP']
 *   }
 * });
 * ```
 *
 * @example
 * Hide parking and gas stations:
 * ```ts
 * poisModule.configure({
 *   categoryFilter: {
 *     mode: 'hide',
 *     values: ['PARKING_GROUP', 'GAS_STATIONS_GROUP']
 *   }
 * });
 * ```
 *
 * @example
 * Combine multiple groups for tourism use case:
 * ```ts
 * const tourismFilter = {
 *   mode: 'show',
 *   values: [
 *     'HOLIDAY_TOURISM_GROUP',
 *     'ACCOMMODATION_GROUP',
 *     'FOOD_DRINKS_GROUP',
 *     'ENTERTAINMENT_GROUP'
 *   ]
 * };
 * ```
 *
 * @see {@link poiCategoryGroups} - The object containing all group definitions
 * @see {@link MapStylePOICategory} - For individual POI categories
 *
 * @group POIs
 */
export type POICategoryGroup = keyof typeof poiCategoryGroups;
