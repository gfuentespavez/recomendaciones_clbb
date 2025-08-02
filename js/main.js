import { map } from './map.js';
import { loadData } from './dataLoader.js';
import { setupForm } from './formHandler.js';
import { setupFilters } from './filters.js';
import { initSearch } from './search.js';

// 🚀 Inicialización principal
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM listo. Inicializando aplicación...');

    // Inicializar módulos
    setupForm();
    setupFilters();
    initSearch();
    loadData();

    // Cargar ícono SVG del menú
    loadSVGInline('assets/svg/menu-1.svg', '.menu-icon');

    // FAB y offcanvas
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
    const openModalBtn = document.getElementById('openModalBtn');
    const submitModalEl = document.getElementById('submitModal');

    if (openModalBtn && submitModalEl) {
        openModalBtn.addEventListener('click', () => {
            const offcanvasElements = document.querySelectorAll('.offcanvas');
            const offcanvasInstances = Array.from(offcanvasElements)
                .map(el => bootstrap.Offcanvas.getInstance(el))
                .filter(i => i);

            if (offcanvasInstances.length === 0) {
                new bootstrap.Modal(submitModalEl).show();
                return;
            }

            let closedCount = 0;
            offcanvasInstances.forEach(instance => instance.hide());

            offcanvasElements.forEach(el => {
                el.addEventListener(
                    'hidden.bs.offcanvas',
                    () => {
                        closedCount++;
                        if (closedCount === offcanvasInstances.length) {
                            new bootstrap.Modal(submitModalEl).show();
                        }
                    },
                    { once: true }
                );
            });
        });
    }
});

// 🔄 Auto-refresh del mapa cada 10 segundos (si no hay popup abierto)
setInterval(() => {
    const popupVisible = document.querySelector('.mapboxgl-popup.open');
    if (!popupVisible) {
        loadData();
        console.log('Mapa actualizado automáticamente');
    }
}, 10000);

// 📦 Cargar SVG inline
async function loadSVGInline(path, targetSelector) {
    try {
        const res = await fetch(path);
        const svgText = await res.text();
        const container = document.querySelector(targetSelector);
        if (container) container.innerHTML = svgText;
    } catch (error) {
        console.error("Error cargando SVG:", error);
    }
}
