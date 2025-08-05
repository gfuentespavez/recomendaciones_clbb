import { supabase } from './supabaseClient.js';
import { map } from './map.js';
import { clearMarkers, addLugarMarker } from './markerManager.js';

// 🔍 Interpreta la consulta del usuario
function interpretarQuery(q) {
    const comunas = ['concepción', 'talcahuano', 'hualpén', 'chiguayante', 'san pedro'];
    const categorias = ['pizza', 'sushi', 'café', 'bar', 'música', 'parque', 'heladería', 'museo', 'playa'];
    const mejor = q.includes('mejor');
    const comuna = comunas.find(c => q.includes(c));
    const categoria = categorias.find(cat => q.includes(cat));
    return { mejor, comuna, categoria };
}

// search.js - Reemplaza la función handleSearch con esta

async function handleSearch(query, onFinish) {
    const q = query.toLowerCase().trim();
    if (!q) return;

    const { categoria, comuna, mejor } = interpretarQuery(q);

    try {
        const { data: lugares, error } = await supabase.rpc('buscar_lugares_con_promedio', {
            categoria_query: categoria || '',
            comuna_query: comuna || ''
        });

        if (error) {
            console.error('Error al llamar la función RPC:', error);
            alert('Hubo un problema al buscar los lugares.');
            return;
        }

        if (!lugares || lugares.length === 0) {
            alert('No se encontraron lugares.');
            return;
        }

        mostrarLugarEnMapa(lugares);

        if (mejor && lugares.length > 0) {
            const mejorLugar = lugares[0];
            map.flyTo({ center: [mejorLugar.longitude, mejorLugar.latitude], zoom: 15 });
        } else if (lugares.length > 1) {
            const bounds = new mapboxgl.LngLatBounds();
            lugares.forEach(l => bounds.extend([l.longitude, l.latitude]));
            map.fitBounds(bounds, { padding: 100 });
        } else {
            map.flyTo({ center: [lugares[0].longitude, lugares[0].latitude], zoom: 15 });
        }

        // ✅ Cierra el overlay si todo salió bien
        if (typeof onFinish === 'function') {
            onFinish();
        }

    } catch (err) {
        console.error('Error en búsqueda:', err.message);
        alert('Hubo un problema al buscar los lugares.');
    }
}



// También actualiza tu función `mostrarLugarEnMapa` para que limpie los marcadores
// y luego añada los nuevos.
function mostrarLugarEnMapa(lugares) {
    clearMarkers(); // Asegúrate que esta función borre los marcadores anteriores

    lugares.forEach(l => {
        addLugarMarker(map, {
            lon: l.longitude,
            lat: l.latitude,
            lugar: l.lugar,
            categoria: l.categoria,
            // Puedes incluso pasar el rating para mostrarlo en el popup!
            promedio: l.promedio_simple,
            cantidad_ratings: l.cantidad_ratings
        });
    });
}

/* // Muestra los lugares en el mapa
function mostrarLugarEnMapa(lugares) {
    clearMarkers();

    if (!lugares.length) {
        alert('No se encontraron lugares :(');
        return;
    }

    const bounds = new mapboxgl.LngLatBounds();

    lugares.forEach(l => {
        addLugarMarker(map, {
            lon: l.longitude,
            lat: l.latitude,
            lugar: l.lugar,
            categoria: l.categoria
        });
        bounds.extend([l.longitude, l.latitude]);
    });

    if (lugares.length === 1) {
        map.flyTo({ center: [lugares[0].longitude, lugares[0].latitude], zoom: 15 });
    } else {
        map.fitBounds(bounds, { padding: 100 });
    }
}

 */

function setupSearchUI(searchInput, searchButton, searchOverlay) {
    const openOverlay = () => {
        searchOverlay.classList.add('active');
        searchInput.focus();
    };

    const closeOverlay = () => {
        searchOverlay.classList.remove('active');
        searchInput.value = '';
        searchButton.focus();
    };

    searchButton.addEventListener('click', () => {
        const isActive = searchOverlay.classList.contains('active');
        if (isActive) {
            closeOverlay();
        } else {
            openOverlay();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeOverlay();
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch(searchInput.value, closeOverlay); // 👈 Llamamos al cierre como callback
        }
    });
}



// 🚀 Inicializa el buscador de forma segura
export function initSearch() {
    const searchInput = document.getElementById('searchTextarea');
    const searchButton = document.getElementById('searchToggleButton');
    const searchOverlay = document.getElementById('searchOverlay');

    if (!searchInput || !searchButton || !searchOverlay) {
        console.warn('Elementos de búsqueda no encontrados en el DOM');
        return;
    }

    searchButton.addEventListener('click', () => {
        const isActive = searchOverlay.classList.contains('active');
        searchOverlay.classList.toggle('active');

        if (!isActive) {
            searchInput.focus();
        } else {
            searchInput.value = '';
            searchButton.focus();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
            searchOverlay.classList.remove('active');
            searchInput.value = '';
            searchButton.focus();
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch(searchInput.value);
        }
    });

    console.log('Buscador inicializado correctamente');
}