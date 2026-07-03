/**
 * @module agent-toolkit-engine
 *
 * The {@link JobEngine} — the single recurrence engine behind every standing computation in the toolkit.
 * A job is one entry-anchored unit of recurring work: an opaque `run` thunk plus the `affectedEntryIds`
 * it depends on. The engine subscribes once per input slice to `entries-change`, and on each change
 * re-runs exactly the active jobs whose `affectedEntryIds` intersect the changed ids — an unrelated
 * entry's change matches nothing and runs nothing.
 *
 * The engine is deliberately generic: it never interprets `run` (the tools layer builds that closure,
 * which owns input prep, the sandbox crossing, reading `previous`, and writing the result to its sink).
 * So the engine imports the INPUT slices only (read side, via {@link ensureWired}) and depends on no
 * output sink — results leave a job only through its own `run`. The engine holds no results.
 *
 * Linkage to a sink is by reference, not convention: {@link register} returns a {@link Job} handle and
 * the owner stores it (e.g. `Analyses._jobs`, `EventsState._jobs`). Use the handle to `setActive`
 * (pause/resume — a paused job is retained but never scanned, so a one-shot `analyseData` keeps its recipe
 * for later promotion) or `unregister`.
 *
 * @group Agent Toolkit
 */

import type { ToolState } from '../types';

/** What {@link JobEngine.register} needs to mint a {@link Job}. `run` and `onOrphaned` are owner closures. */
export type JobSpec = {
    /** Ids of every entry this job reads. The engine re-runs the job when any of them changes. */
    affectedEntryIds: readonly string[];
    /** The recipe, opaque to the engine — stored as the single home of the code + for re-arm change-detect. */
    code: string;
    /** Whether the engine scans this job. A paused job (`false`) is retained but never run. */
    active: boolean;
    /** Owner closure: prepare inputs → run sandbox → write result to its sink. The engine never inspects it. */
    run: () => Promise<void>;
    /** Owner closure invoked just before the engine drops the job because all its source entries are gone. */
    onOrphaned?: () => void;
};

/** A registered job, handed back to the owner as the reference linking a sink record to its recurrence. */
export interface Job {
    /** Ids of every entry this job reads (immutable; a re-arm with different sources is a different job). */
    readonly affectedEntryIds: readonly string[];
    /** The recipe behind this job — compared on re-arm to decide whether to drop stale history. */
    readonly code: string;
    /** Whether the engine currently scans this job. */
    readonly active: boolean;
    /** Pause (`false`) or resume (`true`) scanning. A paused job keeps its recipe for later promotion. */
    setActive(active: boolean): void;
    /** Remove the job from the engine. The owner drops its stored reference. */
    unregister(): void;
}

/** The shared surface of every input slice the engine watches: an `entries-change` emitter + `entries`
 * with ids. The slices' full event maps differ, so {@link JobEngine.sourceSlices} narrows to this. */
type SourceSlice = {
    readonly events: {
        on(event: 'entries-change', handler: (payload: { changedIds: readonly string[] }) => void): unknown;
    };
    readonly entries: readonly { id: string }[];
};

/**
 * Session-level recurrence engine. Held on `ToolState` as `state.engine`; constructed and wired by the
 * state factory. Owners ({@link Analyses}, {@link EventsState}) register jobs and keep the returned
 * handles.
 *
 * @group Agent Toolkit
 */
export class JobEngine {
    private readonly jobs = new Set<JobHandle>();
    private wired = false;
    // Off-job runtime flags. `scanning` ignores a change landing mid-scan (rare, self-correcting — the
    // next change re-runs it); `scheduled` coalesces a synchronous burst of `entries-change` into one
    // scan; `pending` accumulates the changed entry ids across that burst so the scan runs exactly the
    // jobs whose sources moved.
    private scanning = false;
    private scheduled = false;
    private pending = new Set<string>();

    /** Register a job and return its handle. Stored by the owner as its reference to the recurrence. */
    register(spec: JobSpec): Job {
        const job = new JobHandle(spec, this);
        this.jobs.add(job);
        return job;
    }

    /** @internal — called by {@link JobHandle.unregister}. */
    drop(job: JobHandle): void {
        this.jobs.delete(job);
    }

    /**
     * Subscribe the scan to every input slice's `entries-change`, exactly once per session. The state
     * factory calls this at construction (it holds the slices), so every `ToolState` gets a live engine
     * without the job builders having to wire lazily.
     */
    ensureWired(state: ToolState): void {
        if (this.wired) return;
        this.wired = true;
        const onChange = (payload: { changedIds: readonly string[] }) => this.onChange(state, payload.changedIds);
        for (const slice of this.sourceSlices(state)) slice.events.on('entries-change', onChange);
    }

    // The input slices whose entries can anchor a job: places / routes / incidents / area-analytics /
    // byod / custom-geometries. Single source of truth for both wiring (subscribe) and orphan GC
    // (liveness), so the set can't drift between them. Ranges feed in but never anchor a job.
    private sourceSlices(state: ToolState): readonly SourceSlice[] {
        return [
            state.places,
            state.routing,
            state.trafficIncidents,
            state.trafficAreaAnalytics,
            state.byod,
            state.customGeometries,
        ] as unknown as readonly SourceSlice[];
    }

    private onChange(state: ToolState, changedIds: readonly string[]): void {
        this.collectOrphans(state);
        for (const id of changedIds) this.pending.add(id);
        this.scheduleScan();
    }

    // Drop jobs whose source entries have ALL been removed, invoking each one's `onOrphaned` so its owner
    // drops the matching sink record. Entries no longer carry their jobs, so a removal can't GC implicitly;
    // we collect on every `entries-change` against the live source-entry ids. Snapshot the orphans before
    // mutating `jobs`, and let the engine own removal (delete first; a sink's `onOrphaned`→`unregister`
    // then no-ops) so there's no mutation-during-iteration and no double-fire.
    private collectOrphans(state: ToolState): void {
        const live = new Set<string>();
        for (const slice of this.sourceSlices(state)) for (const entry of slice.entries) live.add(entry.id);

        const orphans = [...this.jobs].filter((job) => !job.affectedEntryIds.some((id) => live.has(id)));
        for (const job of orphans) {
            this.jobs.delete(job);
            job.onOrphaned?.();
        }
    }

    private hasActiveJob(): boolean {
        for (const job of this.jobs) if (job.active) return true;
        return false;
    }

    private scheduleScan(): void {
        // Collapse a synchronous burst (scheduled) and ignore changes landing mid-scan (scanning).
        if (this.scanning || this.scheduled) return;
        // Nothing active — drop the accumulated ids so `pending` can't grow unbounded.
        if (!this.hasActiveJob()) {
            this.pending.clear();
            return;
        }
        this.scheduled = true;
        queueMicrotask(() => {
            this.scheduled = false;
            void this.runScan();
        });
    }

    private async runScan(): Promise<void> {
        const changed = this.pending;
        this.pending = new Set();
        this.scanning = true;
        try {
            // Run only the active jobs whose sources actually moved — an unrelated entry's change leaves
            // every `affectedEntryIds` disjoint from `changed` and runs nothing.
            for (const job of this.jobs) {
                if (!job.active) continue;
                if (!job.affectedEntryIds.some((id) => changed.has(id))) continue;
                await job.run();
            }
        } finally {
            this.scanning = false;
        }
    }

    /** Drop every job. Walked automatically by `destroyState` (duck-typed `reset`). Subscriptions persist
     * (harmless without jobs), mirroring the one-shot `wired` guard. */
    reset(): void {
        this.jobs.clear();
        this.pending.clear();
        this.scanning = false;
        this.scheduled = false;
    }
}

// The concrete job handed back to owners — a reference linking a sink record to its recurrence.
class JobHandle implements Job {
    readonly affectedEntryIds: readonly string[];
    readonly code: string;
    active: boolean;
    readonly run: () => Promise<void>;
    readonly onOrphaned?: () => void;

    constructor(
        spec: JobSpec,
        private readonly engine: JobEngine,
    ) {
        this.affectedEntryIds = spec.affectedEntryIds;
        this.code = spec.code;
        this.active = spec.active;
        this.run = spec.run;
        this.onOrphaned = spec.onOrphaned;
    }

    setActive(active: boolean): void {
        this.active = active;
    }

    unregister(): void {
        this.engine.drop(this);
    }
}
