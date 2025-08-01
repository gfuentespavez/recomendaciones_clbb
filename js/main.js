import { map } from './map.js';
import { loadData } from './dataLoader.js';
import { setupForm } from './formHandler.js';
import { setupFilters } from './filters.js';

setupForm();
setupFilters();
loadData();

// === SVG loader ===
async function loadSVGInline(path, targetSelector) {
    try {
        const res = await fetch(path);
        const svgText = await res.text();
        const container = document.querySelector(targetSelector);
        if (container) container.innerHTML = svgText;
    } catch (error) {
        console.error("Error loading SVG:", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Cargar SVG del ícono del menú
    loadSVGInline('assets/svg/menu-1.svg', '.menu-icon');

    // Mostrar y ocultar botón FAB según offcanvas
    const fabMenu = document.getElementById('main-fab-menu');
    const offcanvasEl = document.getElementById('menuOffcanvas');

    if (fabMenu && offcanvasEl) {
        offcanvasEl.addEventListener('shown.bs.offcanvas', () => {
            fabMenu.style.display = 'none';
        });

        offcanvasEl.addEventListener('hidden.bs.offcanvas', () => {
            fabMenu.style.display = 'block';
        });
    }

    // Mostrar modal si no hay offcanvas abierto
    document.getElementById('openModalBtn')?.addEventListener('click', () => {
        const offcanvasElements = document.querySelectorAll('.offcanvas');
        const offcanvasInstances = Array.from(offcanvasElements)
            .map(el => bootstrap.Offcanvas.getInstance(el))
            .filter(i => i);

        if (offcanvasInstances.length === 0) {
            const modal = new bootstrap.Modal(document.getElementById('submitModal'));
            modal.show();
            return;
        }

        offcanvasInstances.forEach(instance => instance.hide());

        let closedCount = 0;
        offcanvasElements.forEach(el => {
            el.addEventListener(
                'hidden.bs.offcanvas',
                () => {
                    closedCount++;
                    if (closedCount === offcanvasInstances.length) {
                        const modal = new bootstrap.Modal(document.getElementById('submitModal'));
                        modal.show();
                    }
                },
                { once: true }
            );
        });
    });
});

// Auto-refresh del mapa cada 10 segundos (si no hay popup abierto)
setInterval(() => {
    const popupVisible = document.querySelector('.mapboxgl-popup.open');
    if (!popupVisible) {
        loadData();
        console.log('Mapa actualizado automáticamente');
    }
}, 10000);