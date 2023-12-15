import { callService } from "../shared/serviceTemplate";
import { CalculateMatrixRouteParams } from "./types/calculateMatrixRouteParams";
import { calculateMatrixRouteTemplate } from "./calculateMatrixRouteTemplate";
import { CalculateMatrixRouteResponseAPI } from "./types/apiResponseTypes";

export const calculateMatrixRoute = async (
    params: CalculateMatrixRouteParams
): Promise<CalculateMatrixRouteResponseAPI> => callService(params, calculateMatrixRouteTemplate, "MatrixRouting");
