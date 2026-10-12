import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { avoidableTypes } from '@tomtom-org/maps-sdk/core';
import { routeTypes } from '@tomtom-org/maps-sdk/services';
import { ArrowUpDown, Eraser, GripVertical, Plus, X } from 'lucide-react';
import type { Dispatch } from 'react';
import { duration, placeSubtitle, placeTitle } from '../format';
import { avoidLooks, routeTypeLooks } from '../planner/routeOptions';
import { createStop, emptyStops, type Stop, type StopsAction, stopBadge, stopRole } from '../planner/stops';
import { ChipChecklist, Select } from './fields';
import './stop.css';
import './StopList.css';

const stayMinuteOptions = [0, 5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240];

const legRouteTypes = [undefined, ...routeTypes];

type StopListProps = {
    stops: Stop[];
    dispatch: Dispatch<StopsAction>;
    targetStopId?: string;
    /** An empty row was picked: the next search pick fills it. */
    onTarget: (id?: string) => void;
};

export const StopList = ({ stops, dispatch, targetStopId, onTarget }: StopListProps) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );
    const filled = stops.filter((stop) => stop.place).length;

    const addStop = () => {
        const stop = createStop();
        dispatch({ type: 'insert', index: stops.length - 1, stop });
        onTarget(stop.id);
    };

    const move = ({ active, over }: DragEndEvent) => {
        const from = stops.findIndex((stop) => stop.id === active.id);
        const to = stops.findIndex((stop) => stop.id === over?.id);
        if (to >= 0 && to !== from) dispatch({ type: 'move', from, to });
    };

    return (
        <div className="ui-section">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                onDragEnd={move}
            >
                <SortableContext items={stops} strategy={verticalListSortingStrategy}>
                    <ol className="ui-stop-list">
                        {stops.map((stop, index) => (
                            <StopRow
                                key={stop.id}
                                stop={stop}
                                index={index}
                                count={stops.length}
                                dispatch={dispatch}
                                targeted={stop.id === targetStopId}
                                onTarget={onTarget}
                            />
                        ))}
                    </ol>
                </SortableContext>
            </DndContext>
            <div className="ui-button-group-horizontal ui-stop-actions">
                <button
                    type="button"
                    className="ui-button ui-button-outline ui-button-sm ui-button-with-icon"
                    onClick={addStop}
                >
                    <Plus /> Add stop
                </button>
                <button
                    type="button"
                    className="ui-button ui-button-ghost ui-button-sm ui-button-with-icon"
                    disabled={filled < 2}
                    onClick={() => dispatch({ type: 'reverse' })}
                >
                    <ArrowUpDown /> Reverse
                </button>
                <button
                    type="button"
                    className="ui-button ui-button-ghost ui-button-sm ui-button-with-icon"
                    disabled={!filled}
                    onClick={() => dispatch({ type: 'replace', stops: emptyStops() })}
                >
                    <Eraser /> Clear
                </button>
            </div>
            <p className="ui-note">
                Drag a row by its handle to reorder, or focus the handle and use Space and the arrow keys. Click the
                map, a place or a search result to add a stop.
            </p>
        </div>
    );
};

type StopRowProps = {
    stop: Stop;
    index: number;
    count: number;
    dispatch: Dispatch<StopsAction>;
    targeted: boolean;
    onTarget: (id?: string) => void;
};

const StopRow = ({ stop, index, count, dispatch, targeted, onTarget }: StopRowProps) => {
    const isEnd = index === 0 || index === count - 1;
    const role = stopRole(index, count);
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
        id: stop.id,
    });
    return (
        <li
            ref={setNodeRef}
            className={`ui-stop${isDragging ? ' is-dragging' : ''}`}
            style={{ transform: CSS.Translate.toString(transform), transition }}
        >
            <button
                type="button"
                ref={setActivatorNodeRef}
                className="ui-stop-handle"
                aria-label={`Drag ${role} to reorder`}
                {...attributes}
                {...listeners}
            >
                <GripVertical />
            </button>
            <span className={`ui-stop-badge${isEnd ? ' is-end' : ''}`}>{stopBadge(index, count)}</span>
            <div className="ui-stop-body">
                {stop.place ? (
                    <>
                        <span className="ui-stop-title">{placeTitle(stop.place)}</span>
                        <span className="ui-stop-subtitle">
                            {[
                                placeSubtitle(stop.place),
                                !isEnd &&
                                    stop.pauseDurationSeconds > 0 &&
                                    `stay ${duration(stop.pauseDurationSeconds)}`,
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                        </span>
                    </>
                ) : (
                    <button
                        type="button"
                        className={`ui-stop-empty${targeted ? ' is-targeted' : ''}`}
                        onClick={() => onTarget(targeted ? undefined : stop.id)}
                    >
                        {targeted ? `Now search for ${role}` : `Choose ${role}`}
                    </button>
                )}
                {stop.place && (
                    <StopOptions
                        stop={stop}
                        title={placeTitle(stop.place)}
                        isEnd={isEnd}
                        isStart={index === 0}
                        dispatch={dispatch}
                    />
                )}
            </div>
            <button
                type="button"
                className="ui-button ui-button-ghost ui-button-icon ui-button-xs"
                aria-label={`Remove ${role}`}
                disabled={!stop.place && count <= 2}
                onClick={() => dispatch({ type: 'remove', id: stop.id })}
            >
                <X />
            </button>
        </li>
    );
};

type StopOptionsProps = {
    stop: Stop;
    title: string;
    isStart: boolean;
    isEnd: boolean;
    dispatch: Dispatch<StopsAction>;
};

/** The stay, for a stop between the ends, and how to drive the leg arriving here. */
const StopOptions = ({ stop, title, isStart, isEnd, dispatch }: StopOptionsProps) => {
    const { legCostModel } = stop;
    const customLeg = Boolean(legCostModel.routeType || legCostModel.avoid?.length);
    const update = (changes: Partial<Pick<Stop, 'pauseDurationSeconds' | 'legCostModel'>>) =>
        dispatch({ type: 'update', id: stop.id, changes });

    return (
        <div className="ui-stop-options">
            {!isEnd && (
                <Select
                    aria-label={`Stay at ${title}`}
                    options={stayMinuteOptions}
                    optionLabel={(minutes) => (minutes ? `Stay ${duration(minutes * 60)}` : 'No stay')}
                    value={stop.pauseDurationSeconds / 60}
                    onChange={(minutes) => update({ pauseDurationSeconds: minutes * 60 })}
                />
            )}
            {!isStart && (
                <details className="ui-leg-options">
                    <summary>
                        Getting here
                        {customLeg && <span className="ui-leg-badge">custom</span>}
                    </summary>
                    <Select
                        aria-label="Route type for this leg"
                        options={legRouteTypes}
                        optionLabel={(routeType) => (routeType ? routeTypeLooks[routeType].label : 'Same as the trip')}
                        value={legCostModel.routeType}
                        onChange={(routeType) => update({ legCostModel: { ...legCostModel, routeType } })}
                    />
                    <ChipChecklist
                        label="Avoid on this leg"
                        compact
                        options={avoidableTypes}
                        look={(avoidable) => avoidLooks[avoidable]}
                        selected={legCostModel.avoid}
                        onChange={(avoid) => update({ legCostModel: { ...legCostModel, avoid } })}
                    />
                </details>
            )}
        </div>
    );
};
