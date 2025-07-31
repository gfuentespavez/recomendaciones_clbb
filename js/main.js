import { map } from './map.js';
import { loadData } from './dataLoader.js';
import { setupForm } from './formHandler.js';
import { setupFilters } from './filters.js';

setupForm();
setupFilters();
loadData();

setInterval(() => {
    const popupVisible = document.querySelector('.mapboxgl-popup.open');
    if (!popupVisible) {
        loadData();
        console.log('Mapa actualizado automáticamente');
    }
}, 90000);
