import type { TomTomMap } from '@tomtom-org/maps-sdk/map';

/** Moves every map with whichever one the user moves. */
export const syncCameras = (maps: TomTomMap[]) => {
    // `jumpTo` fires `move` on each follower synchronously, so the flag stops them echoing the move back.
    let syncing = false;
    for (const leader of maps) {
        leader.mapLibreMap.on('move', () => {
            if (syncing) return;

            syncing = true;
            const camera = {
                center: leader.mapLibreMap.getCenter(),
                zoom: leader.mapLibreMap.getZoom(),
                bearing: leader.mapLibreMap.getBearing(),
                pitch: leader.mapLibreMap.getPitch(),
            };
            for (const follower of maps) {
                if (follower !== leader) follower.mapLibreMap.jumpTo(camera);
            }
            syncing = false;
        });
    }
};
