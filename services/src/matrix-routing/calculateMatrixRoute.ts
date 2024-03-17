import { callService } from "../shared/serviceTemplate";
import type { CalculateMatrixRouteParams } from "./types/calculateMatrixRouteParams";
import { calculateMatrixRouteTemplate } from "./calculateMatrixRouteTemplate";
import type { CalculateMatrixRouteResponseAPI } from "./types/apiResponseTypes";

export const calculateMatrixRoute = async (
    params: CalculateMatrixRouteParams
): Promise<CalculateMatrixRouteResponseAPI> => callService(params, calculateMatrixRouteTemplate, "MatrixRouting");
