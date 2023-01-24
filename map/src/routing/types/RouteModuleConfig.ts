/**
 * Parameters for the routing module.
 */
export type RoutingModuleConfig = {
    /**
     * Whether the layers for this module are to be interactive.
     * * The user can interact with the layers from this module.
     * @default false
     */
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
