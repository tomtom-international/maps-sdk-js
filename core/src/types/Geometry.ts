import { Feature, Point, Position } from "geojson";

export type HasLngLat = Position | Point | Feature<Point>;
