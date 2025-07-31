import { MAPBOX_TOKEN } from './secrets.js';

mapboxgl.accessToken = MAPBOX_TOKEN;

export const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/germanfuentes/cmcybcvt501b001s4473g8ttb',
    center: [-73.05879, -36.83002],
    zoom: 16.73,
    pitch: 63,
    bearing: -109.48,
});
