import * as Popover from '@radix-ui/react-popover';
import { standardStyleIDs } from '@tomtom-org/maps-sdk/map';
import { Building, Layers, Mountain, MountainSnow, TrafficCone, TriangleAlert, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import {
    hillshadeLookIds,
    hillshadeLooks,
    lookSwatch,
    type MapLook,
    mapPresets,
    poiFocuses,
    poiFocusIds,
    sameLook,
    styleLabels,
    themes,
    themesFor,
} from '../mapLook/looks';
import { ChipButton, type ChipLook, FactorSlider, Field, Select } from './fields';
import { MapThumbnail } from './MapThumbnail';
import './MapLookPanel.css';

type MapLookProps = { look: MapLook; onChange: (look: MapLook) => void };

type SectionProps = { look: MapLook; update: (changes: Partial<MapLook>) => void };

/** The layers button on the map, and the panel it opens below itself. */
export const MapLookControl = ({ look, onChange }: MapLookProps) => {
    const [open, setOpen] = useState(false);
    const update = (changes: Partial<MapLook>) => onChange({ ...look, ...changes });
    return (
        <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger asChild>
                <button
                    type="button"
                    className={`ui-button ui-toggle ui-button-with-icon ui-map-button${open ? ' active' : ''}`}
                    aria-label="Map type and layers"
                >
                    <Layers /> Map
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    className="ui-customPanel ui-map-panel"
                    side="bottom"
                    align="end"
                    sideOffset={8}
                    collisionPadding={12}
                >
                    <div className="ui-panel-header">
                        <h3 className="ui-heading">
                            <span className="ui-heading-text">Map</span>
                            <Popover.Close
                                className="ui-button ui-button-ghost ui-button-icon ui-button-xs"
                                aria-label="Close"
                            >
                                <X />
                            </Popover.Close>
                        </h3>
                    </div>
                    <div className="ui-panel-content">
                        <MapTypeSection look={look} update={update} />
                        <DetailsSection look={look} update={update} />
                        <PresetSection look={look} onChange={onChange} />
                        <details className="ui-fine-tune">
                            <summary>Labels and roads</summary>
                            <FactorSlider
                                label="Label size"
                                value={look.labelSize}
                                onChange={(labelSize) => update({ labelSize })}
                            />
                            <FactorSlider
                                label="Road width"
                                value={look.roadWidth}
                                onChange={(roadWidth) => update({ roadWidth })}
                            />
                        </details>
                    </div>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
};

const MapTypeSection = ({ look, update }: SectionProps) => {
    const fittingThemes = themesFor(look.style);
    return (
        <div className="ui-section">
            <h4 className="ui-subheading">Map type</h4>
            <div className="ui-tile-grid">
                {standardStyleIDs.map((style) => (
                    <button
                        key={style}
                        type="button"
                        className={`ui-option-card ui-tile${look.style === style ? ' active' : ''}`}
                        aria-pressed={look.style === style}
                        // A palette keeps one style's lightness, so a new style starts from its own colours.
                        onClick={() => update({ style, theme: undefined })}
                    >
                        <span className="ui-tile-image">
                            <MapThumbnail swatch={lookSwatch({ style })} />
                        </span>
                        {styleLabels[style]}
                    </button>
                ))}
            </div>
            {fittingThemes.length > 0 && (
                <div className="ui-chip-list" role="group" aria-label="Colours">
                    <ThemeChip active={!look.theme} onClick={() => update({ theme: undefined })}>
                        Its own colours
                    </ThemeChip>
                    {fittingThemes.map((id) => (
                        <ThemeChip
                            key={id}
                            active={look.theme === id}
                            accent={themes[id].colors.accent}
                            onClick={() => update({ theme: id })}
                        >
                            {themes[id].label}
                        </ThemeChip>
                    ))}
                </div>
            )}
        </div>
    );
};

type ThemeChipProps = { active: boolean; accent?: string; onClick: () => void; children: ReactNode };

const ThemeChip = ({ active, accent, onClick, children }: ThemeChipProps) => (
    <button
        type="button"
        className={`ui-button ui-toggle ui-button-xs ui-chip${active ? ' active' : ''}`}
        aria-pressed={active}
        onClick={onClick}
    >
        {accent && <span className="ui-chip-dot" style={{ background: accent }} />}
        {children}
    </button>
);

/** The layers over the base map, each a chip that turns it on or off. */
const detailToggles: (ChipLook & { on: (look: MapLook) => boolean; toggle: (on: boolean) => Partial<MapLook> })[] = [
    { label: 'Traffic', icon: TrafficCone, on: (look) => look.trafficFlow, toggle: (trafficFlow) => ({ trafficFlow }) },
    {
        label: 'Incidents',
        icon: TriangleAlert,
        on: (look) => look.trafficIncidents,
        toggle: (trafficIncidents) => ({ trafficIncidents }),
    },
    {
        label: '3D buildings',
        icon: Building,
        on: (look) => look.buildings3D,
        toggle: (buildings3D) => ({ buildings3D }),
    },
    {
        label: 'Relief',
        icon: Mountain,
        on: (look) => look.hillshade !== undefined,
        toggle: (on) => ({ hillshade: on ? 'styleDefault' : undefined }),
    },
    { label: '3D terrain', icon: MountainSnow, on: (look) => look.terrain, toggle: (terrain) => ({ terrain }) },
];

const DetailsSection = ({ look, update }: SectionProps) => (
    <div className="ui-section">
        <h4 className="ui-subheading">Map details</h4>
        <div className="ui-chip-list ui-detail-toggles" role="group" aria-label="Map details">
            {detailToggles.map(({ on, toggle, ...chipLook }) => (
                <ChipButton
                    key={chipLook.label}
                    look={chipLook}
                    active={on(look)}
                    onClick={() => update(toggle(!on(look)))}
                />
            ))}
        </div>
        {look.hillshade && (
            <Field label="Relief shading">
                <Select
                    options={hillshadeLookIds}
                    optionLabel={(id) => hillshadeLooks[id].label}
                    value={look.hillshade}
                    onChange={(hillshade) => update({ hillshade })}
                />
            </Field>
        )}
        {look.terrain && (
            <FactorSlider
                label="Terrain exaggeration"
                min={0.5}
                max={3}
                value={look.exaggeration}
                onChange={(exaggeration) => update({ exaggeration })}
            />
        )}
        <Field label="Places on the map">
            <Select
                options={poiFocusIds}
                optionLabel={(id) => poiFocuses[id].label}
                value={look.pois}
                onChange={(pois) => update({ pois })}
            />
        </Field>
    </div>
);

const PresetSection = ({ look, onChange }: MapLookProps) => (
    <div className="ui-section">
        <h4 className="ui-subheading">Looks for the trip</h4>
        <div className="ui-preset-grid">
            {mapPresets.map((preset) => {
                const active = sameLook(preset.look, look);
                return (
                    <button
                        key={preset.id}
                        type="button"
                        className={`ui-option-card ui-preset${active ? ' active' : ''}`}
                        aria-pressed={active}
                        onClick={() => onChange(preset.look)}
                    >
                        <MapThumbnail swatch={lookSwatch(preset.look)} route />
                        <span className="ui-preset-label">{preset.label}</span>
                        <span className="ui-preset-description">{preset.description}</span>
                    </button>
                );
            })}
        </div>
    </div>
);
