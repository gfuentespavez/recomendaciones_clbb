import { SUPABASE_URL, SUPABASE_KEY, MAPBOX_TOKEN, GOOGLE_MAPS_API_KEY } from './secrets.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
mapboxgl.accessToken = MAPBOX_TOKEN;

let markers = [];

// ==================== MAP INIT ====================

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/germanfuentes/cmcybcvt501b001s4473g8ttb',
    center: [-73.05879, -36.83002],
    zoom: 16.73,
    pitch: 63,
    bearing: -109.48,
});

// ==================== GEOCODING ====================
async function geocodeLugar(lugar, comuna) {
    const address = encodeURIComponent(`${lugar}, ${comuna}, Biobío, Chile`);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${GOOGLE_MAPS_API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "OK" && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lon: location.lng };
    } else {
        console.error("Geocoding failed:", data.status, data.error_message);
        return null;
    }
}


// ==================== DATA LOADER ====================
async function loadData(category = null) {
    markers.forEach(m => m.remove());
    markers = [];

    let query = supabase
        .from('lugares')
        .select(`
      id, lugar, comuna, categoria, lat, lon,
      ratings ( rating )
    `);

    if (category && category !== 'all') {
        query = query.eq('categoria', category);
    }

    const { data: lugares, error } = await query;

    if (error) {
        console.error('Error cargando lugares:', error);
        return;
    }

    console.log("Lugares desde Supabase:", lugares);

    lugares.forEach(lugar => {
        const ratings = lugar.ratings || [];
        const suma = ratings.reduce((acc, r) => acc + r.rating, 0);
        const promedio = ratings.length ? (suma / ratings.length).toFixed(1) : 'Sin votos';

        const el = document.createElement('div');
        el.innerHTML = `<img src="assets/svg/pin.svg" style="width:40px; height:40px; cursor:pointer;" />`;

        const popupHTML = `
      <div class="popup-content" data-lugar="${lugar.lugar}" data-id="${lugar.id}">
        <h3>📍 ${lugar.lugar}</h3>
        <p>Comuna: ${lugar.comuna}</p>
        <p>Categoría: ${lugar.categoria}</p>
        <p class="rating-promedio">Rating promedio: 🌟 ${promedio} / 5 (${ratings.length} votos)</p>

        <div class="rating">
          ${[1, 2, 3, 4, 5].map(v => `<span class="star" data-value="${v}">★</span>`).join('')}
        </div>
        <p class="rating-response text-muted small"></p>
      </div>
    `;

        const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([lugar.lon, lugar.lat])
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popupHTML))
            .addTo(map);

        markers.push(marker);
    });
}

// ==================== STAR RATING HANDLER MEJORADO ====================
map.on('popupopen', () => {
    const popup = document.querySelector('.mapboxgl-popup-content .popup-content');
    if (!popup) return;

    let stars = popup.querySelectorAll('.star');
    const response = popup.querySelector('.rating-response');
    const lugarId = popup.dataset.id;

    // Limpia event listeners previos para evitar duplicados
    stars.forEach(star => star.replaceWith(star.cloneNode(true)));
    stars = popup.querySelectorAll('.star');

    stars.forEach(star => {
        star.style.cursor = 'pointer';
        star.onclick = async () => {
            const value = parseInt(star.dataset.value);

            // Inserta rating en Supabase
            const { error } = await supabase.from('ratings').insert([
                { lugar_id: lugarId, rating: value }
            ]);

            if (error) {
                response.innerText = 'Error guardando rating, intenta luego.';
                console.error(error);
                return;
            }

            response.innerText = `Gracias por calificar con ${value} ⭐`;

            // Actualiza promedio en popup sin recargar todo
            const { data: ratings, error: errRatings } = await supabase
                .from('ratings')
                .select('rating')
                .eq('lugar_id', lugarId);

            if (errRatings) {
                console.error(errRatings);
                return;
            }

            const suma = ratings.reduce((acc, r) => acc + r.rating, 0);
            const promedio = ratings.length ? (suma / ratings.length).toFixed(1) : 'Sin votos';

            const ratingPromedioElem = popup.querySelector('p.rating-promedio');
            if (ratingPromedioElem) {
                ratingPromedioElem.innerText = `Rating promedio: 🌟 ${promedio} / 5 (${ratings.length} votos)`;
            }

            // Deshabilita estrellas para evitar múltiples votos seguidos
            stars.forEach(s => s.style.pointerEvents = 'none');
        };
    });
});

// ==================== MODAL + OFFCANVAS SYNC ====================
document.getElementById('openModalBtn').addEventListener('click', () => {
    // Cierra el offcanvas si está abierto
    document.querySelectorAll('.offcanvas').forEach(el => {
        const instance = bootstrap.Offcanvas.getInstance(el);
        if (instance) instance.hide();
    });

    // Abre el modal manualmente
    setTimeout(() => {
        const modal = new bootstrap.Modal(document.getElementById('submitModal'));
        modal.show();
    }, 300);
});

// ==================== FORM HANDLER ====================
document.getElementById('submitForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const form = e.target;

    const lugar = form.lugar.value.trim();
    const comuna = form.comuna.value.trim();
    const categoria = form.categoria.value.trim();

    if (!lugar || !comuna || !categoria) {
        alert('Por favor completa todos los campos.');
        return;
    }

    const coords = await geocodeLugar(lugar, comuna);
    if (!coords) {
        alert('No pudimos geolocalizar el lugar. Intenta ser más específico.');
        return;
    }

    const { data, error } = await supabase.from('lugares').insert([{
        lugar,
        comuna,
        categoria,
        lat: coords.lat,
        lon: coords.lon,
    }]);

    if (error) {
        alert('Error guardando lugar. Intenta de nuevo.');
        console.error(error);
        return;
    }

    // Muestra el toast
    const toastEl = document.getElementById('successToast');
    const toast = new bootstrap.Toast(toastEl);
    toast.show();

    // Cierra el modal
    const modalEl = document.getElementById('submitModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();

    // Limpia backdrop si queda pegado
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = 'auto';

    form.reset();
    loadData();
});

// ==================== CATEGORY FILTERS ====================
document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const category = btn.dataset.category;
        loadData(category);
    });
});

document.getElementById('resetFiltersBtn').addEventListener('click', () => {
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    loadData(null);
});

// ==================== INIT ====================
loadData();

setInterval(() => {
    // Evita recargar mapa si popup abierto (opcional)
    const popupVisible = document.querySelector('.mapboxgl-popup.open');
    if (!popupVisible) {
        loadData();
        console.log('Mapa actualizado automáticamente');
    }
}, 30000);
