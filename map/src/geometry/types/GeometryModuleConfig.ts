import { VectorTileMapModuleConfig } from "../../core";

export type GeometryModuleConfig = Record<string, unknown>;
export type VectorTilesGeometryModuleConfig = Omit<VectorTileMapModuleConfig, "visible">;
