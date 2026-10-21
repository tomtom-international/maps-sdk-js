import { type StandardStyleID, type StyleInput, standardStyleIDs } from '@tomtom-org/maps-sdk/map';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Select } from '../../components';
import type { Agent } from '../useAgentSnapshot';
import { BaseMapPanel } from './BaseMapPanel';
import { MapPOIsPanel } from './MapPOIsPanel';
import { PanelShell } from './PanelShell';
import { TrafficPanel } from './TrafficPanel';

type MapPanelProps = { agent: Agent };

// Human labels for the standard style IDs so the dropdown reads naturally.
const STYLE_LABELS: Record<StandardStyleID, string> = {
    streetLight: 'Street · Light',
    streetDark: 'Street · Dark',
    streetLightDriving: 'Street · Light · Driving',
    streetDarkDriving: 'Street · Dark · Driving',
    monoLight: 'Mono · Light',
    monoDark: 'Mono · Dark',
    streetSatellite: 'Satellite',
};

// The standard style `TomTomMap.getStyleInput()` loads: an id, or a standard style object naming one.
const readStyleId = (style: StyleInput | undefined): StandardStyleID =>
    (typeof style === 'string' ? style : style?.id) ?? 'streetLight';

/**
 * Style switcher subsection — select among TomTom's standard style presets.
 *
 * Re-reads the current style id from `TomTomMap.getStyleInput()` whenever the map
 * fires a style-changed event (e.g. the agent flipped it via the
 * `setMapStandardStyle` tool). `setStyle` carries state over by default, so
 * custom layers/sources are preserved across the swap.
 */
function StyleSwitcher({ agent }: MapPanelProps) {
    const ttMap = agent.state.baseMap.ttMap;
    const [styleId, setStyleId] = useState<StandardStyleID>(() => readStyleId(ttMap.getStyleInput()));

    useEffect(() => {
        // The SDK only offers `addStyleChangeHandler` (no remove pair), so we
        // gate the state update behind an `active` flag instead — once the
        // panel unmounts we silently ignore further notifications.
        let active = true;
        ttMap.addStyleChangeHandler({
            onStyleChanged: () => {
                if (active) setStyleId(readStyleId(ttMap.getStyleInput()));
            },
        });
        return () => {
            active = false;
        };
    }, [ttMap]);

    const onChange = useCallback(
        (next: StandardStyleID) => {
            try {
                ttMap.setStyle(next);
                setStyleId(next);
            } catch (error) {
                console.error('Failed to switch map style', error);
            }
        },
        [ttMap],
    );

    const options = useMemo(() => standardStyleIDs.map((id) => ({ value: id, label: STYLE_LABELS[id] ?? id })), []);

    return (
        <PanelShell title="Style" hint="Switch the underlying TomTom basemap. Custom layers are preserved.">
            <Select<StandardStyleID> label="Map style" value={styleId} options={options} onChange={onChange} />
        </PanelShell>
    );
}

/**
 * Single drawer tab grouping every vector-tile control: style switcher (whole
 * basemap swap), map POIs (built-in POI category filter), base-map layers
 * (water/borders/buildings/roads/labels visibility), and traffic (live flow +
 * incidents). Replaces the separate POIs / Base map / Traffic tabs since they
 * all share the same "configure the rendered base layer" theme.
 */
export function MapPanel({ agent }: MapPanelProps) {
    return (
        <div className="flex flex-col gap-6">
            <StyleSwitcher agent={agent} />
            <MapPOIsPanel agent={agent} />
            <BaseMapPanel agent={agent} />
            <TrafficPanel agent={agent} />
        </div>
    );
}
