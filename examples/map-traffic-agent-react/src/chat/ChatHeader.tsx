import { useState } from 'react';
import chevronDownIconRaw from './assets/chevron-down.svg?raw';
import tomtomLogoRaw from './assets/tomtom-logo.svg?raw';
import { Icon } from './icon';

type ChatHeaderProps = {
    isCollapsed: boolean;
    onToggle: () => void;
    deploymentId: string;
    availableDeployments: readonly string[];
    onDeploymentChange: (deploymentId: string) => void;
};

function MobileNudge({ isCollapsed }: { isCollapsed: boolean }) {
    const [dismissed, setDismissed] = useState(false);
    // Once the user opens the panel, the prompt to "open the panel" is moot.
    if (dismissed || !isCollapsed) return null;
    return (
        <div className="mobile-nudge">
            <span>Tap to chat with the agent — best experienced on desktop</span>
            <button className="mobile-nudge-dismiss" aria-label="Dismiss" onClick={() => setDismissed(true)}>
                &times;
            </button>
        </div>
    );
}

function ModelBadge({
    deploymentId,
    availableDeployments,
    onDeploymentChange,
}: Pick<ChatHeaderProps, 'deploymentId' | 'availableDeployments' | 'onDeploymentChange'>) {
    if (availableDeployments.length <= 1) {
        return <span className="chat-header-model">{deploymentId}</span>;
    }
    return (
        <select
            className="chat-header-model chat-header-model--select"
            value={deploymentId}
            onChange={(e) => onDeploymentChange(e.target.value)}
            aria-label="Model"
        >
            {availableDeployments.map((id) => (
                <option key={id} value={id}>
                    {id}
                </option>
            ))}
        </select>
    );
}

export function ChatHeader({
    isCollapsed,
    onToggle,
    deploymentId,
    availableDeployments,
    onDeploymentChange,
}: ChatHeaderProps) {
    return (
        <>
            <MobileNudge isCollapsed={isCollapsed} />
            <div id="chat-header">
                <span className="chat-header-logo" aria-label="TomTom">
                    <Icon raw={tomtomLogoRaw} />
                </span>
                <span className="chat-header-divider" aria-hidden="true" />
                <span className="chat-header-label">Live Traffic Agent</span>
                <ModelBadge
                    deploymentId={deploymentId}
                    availableDeployments={availableDeployments}
                    onDeploymentChange={onDeploymentChange}
                />
                <button
                    className="chat-collapse-toggle"
                    onClick={onToggle}
                    aria-label={isCollapsed ? 'Expand chat' : 'Collapse chat'}
                >
                    <Icon raw={chevronDownIconRaw} />
                </button>
            </div>
        </>
    );
}
