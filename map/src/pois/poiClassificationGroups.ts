import { poiClassificationToIconID } from "../places";

export const poiClassificationGroups = {
    FOOD_DRINKS_GROUP: [
        poiClassificationToIconID.RESTAURANT,
        poiClassificationToIconID.CAFE_PUB,
        poiClassificationToIconID.WINERY
    ],
    SHOPPING_GROUP: [
        poiClassificationToIconID.SHOP,
        poiClassificationToIconID.SHOPPING_CENTER,
        poiClassificationToIconID.MARKET,
        poiClassificationToIconID.DEPARTMENT_STORE
    ],
    TRANSPORTATION_GROUP: [
        poiClassificationToIconID.AIRPORT,
        poiClassificationToIconID.FERRY_TERMINAL,
        poiClassificationToIconID.HELIPAD,
        poiClassificationToIconID.HELIPAD_HELICOPTER_LANDING,
        poiClassificationToIconID.PUBLIC_TRANSPORT_STOP,
        poiClassificationToIconID.RAILWAY_STATION,
        poiClassificationToIconID.RAILROAD_STATION
    ],
    HEALTH_GROUP: [
        poiClassificationToIconID.DOCTOR,
        poiClassificationToIconID.EMERGENCY_MEDICAL_SERVICE,
        poiClassificationToIconID.EMERGENCY_ROOM,
        poiClassificationToIconID.HEALTH_CARE_SERVICE,
        poiClassificationToIconID.HOSPITAL,
        poiClassificationToIconID.HOSPITAL_POLYCLINIC,
        poiClassificationToIconID.PHARMACY,
        poiClassificationToIconID.DENTIST,
        poiClassificationToIconID.WELFARE_ORGANIZATION
    ],
    PARKING_GROUP: [poiClassificationToIconID.PARKING_GARAGE, poiClassificationToIconID.OPEN_PARKING_AREA],
    HOLIDAY_TOURISM_GROUP: [
        poiClassificationToIconID.AMUSEMENT_PARK,
        poiClassificationToIconID.BEACH,
        poiClassificationToIconID.HOLIDAY_RENTAL,
        poiClassificationToIconID.GEOGRAPHIC_FEATURE,
        poiClassificationToIconID.IMPORTANT_TOURIST_ATTRACTION,
        poiClassificationToIconID.LEISURE_CENTER,
        poiClassificationToIconID.MOUNTAIN_PASS,
        poiClassificationToIconID.MOUNTAIN_PEAK,
        poiClassificationToIconID.MUSEUM,
        poiClassificationToIconID.SCENIC_PANORAMIC_VIEW,
        poiClassificationToIconID.TOURIST_INFORMATION_OFFICE
    ],
    EV_CHARGING_STATIONS_GROUP: [poiClassificationToIconID.ELECTRIC_VEHICLE_STATION],
    GAS_STATIONS_GROUP: [poiClassificationToIconID.GAS_STATION, poiClassificationToIconID.PETROL_STATION],
    ACCOMMODATION_GROUP: [
        poiClassificationToIconID.CAMPING_GROUND,
        poiClassificationToIconID.HOTEL_MOTEL,
        poiClassificationToIconID.HOLIDAY_RENTAL
    ],
    ENTERTAINMENT_GROUP: [
        poiClassificationToIconID.CINEMA,
        poiClassificationToIconID.THEATER,
        poiClassificationToIconID.MOVIE_THEATER,
        poiClassificationToIconID.NIGHTLIFE,
        poiClassificationToIconID.CONCERT_HALL,
        poiClassificationToIconID.ENTERTAINMENT,
        poiClassificationToIconID.CLUB_ASSOCIATION,
        poiClassificationToIconID.CASINO
    ],
    SPORTS_LEISURE_GROUP: [
        poiClassificationToIconID.SPORTS_CENTER,
        poiClassificationToIconID.WATER_SPORT,
        poiClassificationToIconID.SWIMMING_POOL,
        poiClassificationToIconID.GOLF_COURSE,
        poiClassificationToIconID.STADIUM,
        poiClassificationToIconID.BEACH,
        poiClassificationToIconID.ICE_SKATING_RINK,
        poiClassificationToIconID.LEISURE_CENTER,
        poiClassificationToIconID.MOUNTAIN_PASS,
        poiClassificationToIconID.MOUNTAIN_PEAK
    ],
    EDUCATION_GROUP: [
        poiClassificationToIconID.SCHOOL,
        poiClassificationToIconID.COLLEGE_UNIVERSITY,
        poiClassificationToIconID.LIBRARY
    ],
    GOVERNMENT_GROUP: [
        poiClassificationToIconID.GOVERNMENT_OFFICE,
        poiClassificationToIconID.COURTHOUSE,
        poiClassificationToIconID.EMBASSY,
        poiClassificationToIconID.FIRE_STATION_BRIGADE,
        poiClassificationToIconID.POLICE_STATION
    ]
};

export type POIClassificationGroup = keyof typeof poiClassificationGroups;
