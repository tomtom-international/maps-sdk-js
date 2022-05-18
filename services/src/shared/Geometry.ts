import { Position } from 'geojson';

export const csvStringToPosition = (csv: string): Position => csv.split(",").map((coordStr) => Number(coordStr));
