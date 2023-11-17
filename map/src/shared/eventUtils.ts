import isNil from "lodash/isNil";
import omit from "lodash/omit";
import { EventType, SourceWithLayers } from "./types";
import { Feature } from "geojson";
import { MapGeoJSONFeature, Point2D } from "maplibre-gl";
import { GeoJSONSourceWithLayers } from "./SourceWithLayers";
import { areBothDefinedAndEqual } from "./mapUtils";

type IndexedFeature<F extends Feature = Feature> = { feature: F; index: number };

const findFeatureByID = (features: Feature[], id: string | number | undefined): IndexedFeature | undefined => {
    for (let i = 0; i < features.length; i++) {
        const feature = features[i];
        if (feature.id == id) {
            return { feature, index: i };
        }
    }
    return undefined;
};

const isHighPriority = (eventType: EventType): boolean => eventType == "click" || eventType == "contextmenu";

/**
 * Puts or removes the given event state to the right feature in featuresToUpdate based on the
 * @param eventState The new event state to apply or to use as reference.
 * @param featureID The ID of the feature to update within featuresToUpdate.
 * @param featuresToUpdate The features list which will be updated.
 * @param mode If updateInProps, replaces the existing eventState. If removeFromProps, removes the existing eventState.
 * @return The index of the updated feature in the mutated featuresToUpdate array.
 * @ignore
 */
export const putEventState = (
    eventState: EventType,
    featureID: string | number | undefined,
    featuresToUpdate: Feature[], // "featuresToUpdate" will be mutated
    mode: "updateInProps" | "removeFromProps" = "updateInProps"
): number | undefined => {
    const { feature, index } = findFeatureByID(featuresToUpdate, featureID) || {};
    if (feature && (!isHighPriority(feature.properties?.eventState) || isHighPriority(eventState))) {
        const updatedFeature = {
            ...feature,
            properties:
                mode == "updateInProps"
                    ? { ...feature?.properties, eventState }
                    : omit(feature?.properties, "eventState")
        };
        featuresToUpdate.splice(index as number, 1, updatedFeature);
        return index;
    }
    return undefined;
};

const removeEventStateAndShow = (
    newEventType: EventType,
    rawFeature: MapGeoJSONFeature,
    sourceWithLayers: GeoJSONSourceWithLayers
): void => {
    const prevFeaturesToUpdate = [...sourceWithLayers.shownFeatures.features];
    const updatedIndex = putEventState(newEventType, rawFeature.id, prevFeaturesToUpdate, "removeFromProps");
    if (!isNil(updatedIndex)) {
        sourceWithLayers.show({ ...sourceWithLayers.shownFeatures, features: prevFeaturesToUpdate });
    }
};

/**
 * Updates the event state props of the given features.
 * @param eventState The type of event that is being done or undone.
 * @param eventFeature The current MapLibre feature affected by the event, if any.
 * If undefined, it means the event is being undone from prevRawFeature without going to any other one.
 * @param prevEventFeature The previous MapLibre feature affected by the event type, if any (e.g. previous one clicked or hovered).
 * @param sourceWithLayers The source with layers of eventFeature, if any.
 * @param prevSourceWithLayers The source with layers of prevEventFeature, if any.
 * @ignore
 */
export const updateEventState = (
    eventState: EventType,
    eventFeature: MapGeoJSONFeature | undefined,
    prevEventFeature: MapGeoJSONFeature | undefined,
    sourceWithLayers: SourceWithLayers | undefined,
    prevSourceWithLayers: SourceWithLayers | undefined
): Partial<IndexedFeature> => {
    if (eventFeature && sourceWithLayers instanceof GeoJSONSourceWithLayers) {
        const featuresToUpdate = [...sourceWithLayers.shownFeatures.features];
        const updatedIndex = putEventState(eventState, eventFeature.id, featuresToUpdate) as number;

        if (prevEventFeature && !areBothDefinedAndEqual(prevEventFeature, eventFeature)) {
            // (we have both current and prev features for this event type)
            if (prevSourceWithLayers == sourceWithLayers) {
                // we undo the event state from prev feature next to the new one (they will be shown below):
                putEventState(eventState, prevEventFeature.id, featuresToUpdate, "removeFromProps");
            } else if (prevSourceWithLayers instanceof GeoJSONSourceWithLayers) {
                // the prev feature is in other source/layers, so we update and show them:
                removeEventStateAndShow(eventState, prevEventFeature, prevSourceWithLayers);
            }
        }

        sourceWithLayers.show({
            ...sourceWithLayers.shownFeatures,
            features: featuresToUpdate
        });

        return { feature: featuresToUpdate[updatedIndex], index: updatedIndex };
    } else {
        if (prevEventFeature && prevSourceWithLayers instanceof GeoJSONSourceWithLayers) {
            removeEventStateAndShow(eventState, prevEventFeature, prevSourceWithLayers);
        }
        return { feature: eventFeature };
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
    prevHoveredFeature: MapGeoJSONFeature | undefined
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
        } else if (
            (hoveringFeature.id && hoveringFeature.id !== prevHoveredFeature.id) ||
            (hoveringFeature.properties.id && hoveringFeature.properties.id !== prevHoveredFeature.properties.id) ||
            hoveringFeature.source !== prevHoveredFeature.source ||
            // comparing by layer ID is needed when two id-less features from the same source but different layers are compared
            // this can happen when e.g. hovering over different layer groups for the base map
            hoveringFeature.layer.id !== prevHoveredFeature.layer.id
        ) {
            // hovering from one feature to another one (from the same or different layer/source):
            return { hoverChanged: true };
        } else {
            // (else we're hovering along the same feature)
            if (
                prevHoveredPoint &&
                (hoveringPoint.x - prevHoveredPoint.x != 0 || hoveringPoint.y - prevHoveredPoint.y != 0)
            ) {
                return { mouseInMotionOverHoveredFeature: true };
            }
        }
    } else if (prevHoveredFeature) {
        return { hoverChanged: true };
    }
    return {};
};
