import { formatDistance, formatDuration, type Place, type RouteProgressAtPoint } from '@tomtom-org/maps-sdk/core';

export const formatCoordinates = ([longitude, latitude]: number[]): string =>
    `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

// A reverse-geocoded spot with no address match comes back with no properties.
export const placeTitle = (place: Place): string =>
    place.properties?.poi?.name ??
    place.properties?.address?.freeformAddress ??
    formatCoordinates(place.geometry.coordinates);

export const placeSubtitle = (place: Place): string | undefined =>
    place.properties?.poi?.name ? place.properties.address?.freeformAddress : undefined;

export const clockTime = (date: Date): string => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const addSeconds = (date: Date, seconds: number): Date => new Date(date.getTime() + seconds * 1000);

// `formatDuration` writes a whole hour as "1 hr 00 min".
export const duration = (seconds: number): string => formatDuration(seconds).replace(/ 00 min$/, '');

export const distance = (meters: number): string => formatDistance(meters) ?? '0 m';

/** How far into the trip a point of the route is, by the clock and by the road. */
export const progressInto = ({ travelTimeInSeconds, distanceInMeters }: RouteProgressAtPoint): string =>
    `${duration(travelTimeInSeconds)} in, ${distance(distanceInMeters)}`;

export const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));
