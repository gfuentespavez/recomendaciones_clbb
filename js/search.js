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

// 🔎 Ejecuta la búsqueda y muestra resultados en el mapa
async function handleSearch(query) {
    const q = query.toLowerCase().trim();
    if (!q) return;

    const { categoria, comuna, mejor } = interpretarQuery(q);

    try {
        let supabaseQuery = supabase.from('lugares').select('*');

        if (comuna) {
            supabaseQuery = supabaseQuery.ilike('comuna', `%${comuna}%`);
        }

        if (categoria) {
            supabaseQuery = supabaseQuery.ilike('categoria', `%${categoria}%`);
        }

        const { data: lugares, error } = await supabaseQuery;
        if (error) throw error;

        if (!lugares || lugares.length === 0) {
            alert('No se encontraron lugares :(');
            return;
        }

        if (mejor) {
            const { data: ratings, error: ratingsError } = await supabase.from('ratings').select('lugar_id, puntuacion');
            if (ratingsError) throw ratingsError;

            const promedios = lugares.map(l => {
                const puntuaciones = ratings.filter(r => r.lugar_id === l.id).map(r => r.puntuacion);
                const promedio = puntuaciones.length ? puntuaciones.reduce((a, b) => a + b, 0) / puntuaciones.length : 0;
                return { ...l, promedio };
            });

            const mejorLugar = promedios.sort((a, b) => b.promedio - a.promedio)[0];
            mostrarLugarEnMapa([mejorLugar]);
        } else {
            mostrarLugarEnMapa(lugares);
        }
    } catch (err) {
        console.error('Error en búsqueda:', err.message);
        alert('Hubo un problema al buscar los lugares. Intenta nuevamente.');
    }
}

// Muestra los lugares en el mapa
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

// 🧠 Configura el comportamiento del buscador
function setupSearchUI(searchInput, searchButton, searchOverlay) {
    const toggleOverlay = () => {
        const isActive = searchOverlay.classList.contains('active');
        searchOverlay.classList.toggle('active');
        if (!isActive) {
            searchInput.focus();
        } else {
            searchInput.value = '';
            searchButton.focus();
        }
    };

    searchButton.addEventListener('click', toggleOverlay);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
            toggleOverlay();
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch(searchInput.value);
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