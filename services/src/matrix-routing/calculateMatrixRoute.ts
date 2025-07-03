import { callService } from '../shared/serviceTemplate';
import { calculateMatrixRouteTemplate } from './calculateMatrixRouteTemplate';
import type { CalculateMatrixRouteResponseAPI } from './types/apiResponseTypes';
import type { CalculateMatrixRouteParams } from './types/calculateMatrixRouteParams';

export const calculateMatrixRoute = async (
    params: CalculateMatrixRouteParams,
): Promise<CalculateMatrixRouteResponseAPI> => callService(params, calculateMatrixRouteTemplate, 'MatrixRouting');
