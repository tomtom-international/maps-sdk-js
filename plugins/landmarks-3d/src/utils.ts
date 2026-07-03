import type { Mesh, Object3D } from 'three';

/**
 * @ignore
 */
export const isMesh = (object: Object3D): object is Mesh => (object as Mesh).isMesh === true;
