import type { Feature } from 'geojson';
import { isNil, omit } from 'lodash-es';
import type { MapGeoJSONFeature, Point2D } from 'maplibre-gl';
import { findFeatureByRefId, renderedRefId } from './featureId';
import { areBothDefinedAndEqual } from './mapUtils';
import { GeoJSONSourceWithLayers } from './SourceWithLayers';
import type { EventType, SourceWithLayers } from './types';

/**
 * Keep only the hits from `source`; pass everything through when `source` is undefined.
 * Runs on raw `MapGeoJSONFeature`s, before substitution strips `.source`.
 * @ignore
 */
export const scopeToSource = (features: MapGeoJSONFeature[], source: string | undefined): MapGeoJSONFeature[] =>
    source ? features.filter((f) => f.source === source) : features;

/**
 * Collapse duplicate hits keyed on `(source, {@link renderedRefId})`, keeping the first
 * (topmost) occurrence. Features with no recoverable id can't be keyed, so they're all kept.
 * @ignore
 */
export const dedupeRenderedFeatures = (features: MapGeoJSONFeature[]): MapGeoJSONFeature[] => {
    const seen = new Set<string>();
    const out: MapGeoJSONFeature[] = [];
    for (const f of features) {
        const refId = renderedRefId(f);
        if (refId === undefined) {
            out.push(f);
            continue;
        }
        const key = `${f.source} ${refId}`;
        if (!seen.has(key)) {
            seen.add(key);
            out.push(f);
        }
    }
    return out;
};

const isHighPriority = (eventType: EventType): boolean => eventType === 'click' || eventType === 'contextmenu';

/**
 * Puts or removes the given event state to the right feature in featuresToUpdate based on the
 * @param eventState The new event state to apply or to use as reference.
 * @param featureId The ID of the feature to update within featuresToUpdate.
 * @param featuresToUpdate The features list which will be updated.
 * @param mode If updateInProps, replaces the existing eventState. If removeFromProps, removes the existing eventState.
 * @return The index of the updated feature in the mutated featuresToUpdate array.
 * @ignore
 */
export const putEventState = (
    eventState: EventType,
    featureId: string | number | undefined,
    featuresToUpdate: Feature[], // "featuresToUpdate" will be mutated
    mode: 'updateInProps' | 'removeFromProps' = 'updateInProps',
): number | undefined => {
    const { feature, index } = findFeatureByRefId(featuresToUpdate, featureId) || {};
    if (feature && (!isHighPriority(feature.properties?.eventState) || isHighPriority(eventState))) {
        const updatedFeature = {
            ...feature,
            properties:
                mode === 'updateInProps'
                    ? { ...feature?.properties, eventState }
                    : omit(feature?.properties, 'eventState'),
        };
        featuresToUpdate.splice(index as number, 1, updatedFeature);
        return index;
    }
    return undefined;
};

const removeEventStateAndShow = (
    newEventType: EventType,
    rawFeature: MapGeoJSONFeature,
    sourceWithLayers: GeoJSONSourceWithLayers,
): void => {
    const prevFeaturesToUpdate = [...sourceWithLayers.shownFeatures.features];
    // renderedRefId, not rawFeature.id: clustered sources give the rendered feature a synthetic
    // top-level id, so we must key the cache lookup on the real properties.id.
    const updatedIndex = putEventState(
        newEventType,
        renderedRefId(rawFeature),
        prevFeaturesToUpdate,
        'removeFromProps',
    );
    if (!isNil(updatedIndex)) {
        sourceWithLayers.show(
            { ...sourceWithLayers.shownFeatures, features: prevFeaturesToUpdate },
            { automaticVisibility: false },
        );
    }
};

/**
 * Mutates the `eventState` marker on the cached `shownFeatures` so MapLibre paint
 * expressions can react to hover/click. Mutates `prevSourceWithLayers` too when the
 * event moved to a different source. Does not produce a caller-facing feature —
 * the dispatch site resolves that from the post-mutation cache.
 * @ignore
 */
export const updateEventState = (
    eventState: EventType,
    eventFeature: MapGeoJSONFeature | undefined,
    prevEventFeature: MapGeoJSONFeature | undefined,
    sourceWithLayers: SourceWithLayers | undefined,
    prevSourceWithLayers: SourceWithLayers | undefined,
): void => {
    if (eventFeature && sourceWithLayers instanceof GeoJSONSourceWithLayers) {
        const featuresToUpdate = [...sourceWithLayers.shownFeatures.features];
        putEventState(eventState, renderedRefId(eventFeature), featuresToUpdate);

        if (prevEventFeature && !areBothDefinedAndEqual(prevEventFeature, eventFeature)) {
            // (we have both current and prev features for this event type)
            if (prevSourceWithLayers === sourceWithLayers) {
                // we undo the event state from prev feature next to the new one (they will be shown below):
                putEventState(eventState, renderedRefId(prevEventFeature), featuresToUpdate, 'removeFromProps');
            } else if (prevSourceWithLayers instanceof GeoJSONSourceWithLayers) {
                // the prev feature is in other source/layers, so we update and show them:
                removeEventStateAndShow(eventState, prevEventFeature, prevSourceWithLayers);
            }
        }

        sourceWithLayers.show(
            { ...sourceWithLayers.shownFeatures, features: featuresToUpdate },
            { automaticVisibility: false },
        );
        return;
    }
    if (prevEventFeature && prevSourceWithLayers instanceof GeoJSONSourceWithLayers) {
        removeEventStateAndShow(eventState, prevEventFeature, prevSourceWithLayers);
    }
};

/**
 * Detects whether there's been a hovering change with the given event and state params.
 * @param hoveringPoint The current hovering pixel coordinates.
 * @param hoveringFeature The current feature being hovered, if any.
 * @param prevHoveredPoint The pixel coordinates from the previous hovering event, if any.
 * @param prevHoveredFeature The previous feature being hovered, if any (could be the same as hoveringFeature).
 * @ignore
 */
export const detectHoverState = (
    hoveringPoint: Point2D,
    hoveringFeature: MapGeoJSONFeature | undefined,
    prevHoveredPoint: Point2D | undefined,
    prevHoveredFeature: MapGeoJSONFeature | undefined,
): {
    /**
     * Whether a hover state change happened, such as no-hover -> hover or vice-versa.
     */
    hoverChanged?: boolean;
    /**
     * Whether the mouse is moving along the hovered feature (not stopped on it).
     */
    mouseInMotionOverHoveredFeature?: boolean;
} => {
    if (hoveringFeature) {
        if (!prevHoveredFeature) {
            return { hoverChanged: true };
        }
        if (
            (hoveringFeature.id && hoveringFeature.id !== prevHoveredFeature.id) ||
            (hoveringFeature.properties.id && hoveringFeature.properties.id !== prevHoveredFeature.properties.id) ||
            hoveringFeature.source !== prevHoveredFeature.source ||
            // comparing by layer ID is needed when two id-less features from the same source but different layers are compared
            // this can happen when e.g. hovering over different layer groups for the base map
            hoveringFeature.layer.id !== prevHoveredFeature.layer.id
        ) {
            // hovering from one feature to another one (from the same or different layer/source):
            return { hoverChanged: true };
        }
        // (else we're hovering along the same feature)
        if (
            prevHoveredPoint &&
            (hoveringPoint.x - prevHoveredPoint.x != 0 || hoveringPoint.y - prevHoveredPoint.y != 0)
        ) {
            return { mouseInMotionOverHoveredFeature: true };
        }
    } else if (prevHoveredFeature) {
        return { hoverChanged: true };
    }
    return {};
};
