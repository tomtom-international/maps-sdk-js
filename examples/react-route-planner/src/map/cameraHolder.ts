// What holds the camera, such as a fly-over, which sets it every frame and so overrides any other move.
let releaseCamera: (() => void) | undefined;

/** Hands the camera to a holder until {@link reclaimCamera}, which calls `release`. */
export const lendCamera = (release: () => void) => {
    releaseCamera = release;
};

/** Takes the camera back from its holder, if it has one. Every planner move does this first. */
export const reclaimCamera = () => {
    const release = releaseCamera;
    releaseCamera = undefined;
    release?.();
};
