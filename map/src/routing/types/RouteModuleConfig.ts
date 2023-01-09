/**
 * Parameters for the routing module.
 */
export type RoutingModuleConfig = {
    interactive?: boolean;
    sections?: {
        traffic?: {
            visible?: boolean;
            icons?: {
                visible?: boolean;
            };
        };
    };
};
