import { useAgentBootstrap } from './hooks/useAgentBootstrap';

type UseMapAgentOptions = {
    deploymentId: string;
};

/** Top-level composition for the example. Plain agent — just the bootstrap, nothing layered on. */
export function useMapAgent(options: UseMapAgentOptions) {
    return useAgentBootstrap(options);
}
