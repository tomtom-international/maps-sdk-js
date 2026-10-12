import type { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { Popup } from 'maplibre-gl';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type MapPopupProps = {
    map: TomTomMap;
    /** A GeoJSON position. */
    position: number[];
    onClose: () => void;
    children: ReactNode;
};

/** A MapLibre popup whose content React renders, through a portal into the popup's own element. */
export const MapPopup = ({ map, position: [longitude, latitude], onClose, children }: MapPopupProps) => {
    const [container] = useState(() => document.createElement('div'));
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    });

    useEffect(() => {
        const popup = new Popup({
            className: 'ui-maplibre-popup ui-card-popup',
            offset: 28,
            maxWidth: '300px',
            focusAfterOpen: false,
        })
            .setLngLat([longitude, latitude])
            .setDOMContent(container)
            .addTo(map.mapLibreMap);
        const handleClose = () => onCloseRef.current();
        popup.on('close', handleClose);
        return () => {
            // Removed by React, not by the user: no close to report.
            popup.off('close', handleClose);
            popup.remove();
        };
    }, [map, container, longitude, latitude]);

    return createPortal(children, container);
};
