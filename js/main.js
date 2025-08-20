import { map } from './map.js';
import { loadData } from './dataLoader.js';
import { setupForm } from './formHandler.js';
import { setupFilters } from './filters.js';
import { initSearch } from './search.js';
import { supabase } from './supabaseClient.js';

//import { createClient } from "https://esm.sh/@supabase/supabase-js";
//const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
        offcanvasEl.addEventListener('shown.bs.offcanvas', () => fabMenu.style.display = 'none');
        offcanvasEl.addEventListener('hidden.bs.offcanvas', () => fabMenu.style.display = 'block');
    }

    // Modal submit
    const openModalBtn = document.getElementById('openModalBtn');
    const submitModalEl = document.getElementById('submitModal');
    if (openModalBtn && submitModalEl) {
        openModalBtn.addEventListener('click', () => {
            const offcanvasInstances = Array.from(document.querySelectorAll('.offcanvas'))
                .map(el => bootstrap.Offcanvas.getInstance(el))
                .filter(i => i);
            if (offcanvasInstances.length === 0) return new bootstrap.Modal(submitModalEl).show();

            let closedCount = 0;
            offcanvasInstances.forEach(i => i.hide());
            document.querySelectorAll('.offcanvas').forEach(el => {
                el.addEventListener('hidden.bs.offcanvas', () => {
                    closedCount++;
                    if (closedCount === offcanvasInstances.length) new bootstrap.Modal(submitModalEl).show();
                }, { once: true });
            });
        });
    }

    // Formulario de búsqueda geocoding
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (!query) return;

            console.log('Buscando ubicación:', query);
            const data = await geocodeGoogle(query);
            console.log('Resultados Google Maps:', data);

            // Aquí puedes usar `data` para mostrar en tu mapa o UI
        });
    }
});

// 🔄 Auto-refresh del mapa cada 10s (si no hay popup abierto)
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

// 🌐 Geocoding seguro via Edge Function
async function geocodeGoogle(query) {
    try {
        const { data, error } = await supabase.functions.invoke("maps-geocode", {
            body: { provider: "google", q: query }
        });
        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error geocoding Google:', err);
        return null;
    }
}

async function reverseMapbox(lon, lat) {
    try {
        const { data, error } = await supabase.functions.invoke("maps-geocode", {
            body: { provider: "mapbox", lon, lat }
        });
        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error reverse geocoding Mapbox:', err);
        return null;
    }
}