// import mapboxgl from 'mapbox-gl';
import { populateModal } from './modal.js';

let markers = [];

export function clearMarkers() {
    markers.forEach(m => m.remove());
    markers = [];
}

export function addLugarMarker(map, lugar) {
    const el = document.createElement('div');
    const img = document.createElement('img');
    img.src = 'assets/svg/pin.svg';
    img.style.width = '40px';
    img.style.height = '40px';
    img.style.cursor = 'pointer';
    el.appendChild(img);

    img.addEventListener('click', () => {
        populateModal(lugar);
        const modal = new bootstrap.Modal(document.getElementById('infoModal'));
        modal.show();
    });

    const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lugar.lon, lugar.lat])
        .addTo(map);

    markers.push(marker);
}