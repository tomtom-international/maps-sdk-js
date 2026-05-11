import { useCallback, useEffect, useState } from 'react';
import { availableDeployments, defaultDeploymentId } from '../config';

const STORAGE_KEY = 'agent.settings';

export type AgentSettings = {
    deploymentId: string;
};

function loadStored(): Partial<AgentSettings> {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw) as unknown;
        if (typeof parsed !== 'object' || parsed === null) return {};
        return parsed as Partial<AgentSettings>;
    } catch {
        return {};
    }
}

function resolveInitial(): AgentSettings {
    const stored = loadStored();
    const deploymentId =
        typeof stored.deploymentId === 'string' && availableDeployments.includes(stored.deploymentId)
            ? stored.deploymentId
            : defaultDeploymentId;
    return { deploymentId };
}

export function useAgentSettings() {
    const [settings, setSettings] = useState<AgentSettings>(resolveInitial);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch {
            // storage disabled — ignore
        }
    }, [settings]);

    const setDeploymentId = useCallback((deploymentId: string) => {
        setSettings((prev) => ({ ...prev, deploymentId }));
    }, []);

    return {
        settings,
        setDeploymentId,
        availableDeployments,
    };
}
