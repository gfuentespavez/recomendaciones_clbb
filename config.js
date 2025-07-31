import { getFormattedAddress } from './js/places.js';
import { callFindInstagram } from './js/instagram.js';

import { SUPABASE_URL, SUPABASE_KEY, MAPBOX_TOKEN, GOOGLE_MAPS_API_KEY } from './js/secrets.js';
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

// Geocoding con Google Maps
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

// Carga datos y crea marcadores
async function loadData(category = null) {
    markers.forEach(m => m.remove());
    markers = [];

    let query = supabase
        .from('lugares')
        .select(`
  id, lugar, comuna, categoria, lat, lon, formatted_address,
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
        const img = document.createElement('img');
        img.src = 'assets/svg/pin.svg';
        img.style.width = '40px';
        img.style.height = '40px';
        img.style.cursor = 'pointer';
        el.appendChild(img);

        // Manejador de clic para mostrar el modal
        img.addEventListener('click', () => {
            populateModal(lugar);
            const modal = new bootstrap.Modal(document.getElementById('infoModal'));
            modal.show();
        });

        const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([lugar.lon, lugar.lat])
            .addTo(map);

        markers.push(marker);

        console.log('ID del lugar mostrado:', lugar.id);
    });
}

//Call instagram
async function abrirModalConInstagram(lugar, direccion, categoria) {
    const instaData = await callFindInstagram(lugar, direccion, categoria);
    if (instaData && instaData.instagramAccount) {
        // Agrega un botón en el modal, por ejemplo:
        const btn = document.createElement('button');
        btn.textContent = '¿Qué dice el otakin?';
        btn.classList.add('btn', 'btn-warning', 'mt-3');

        btn.addEventListener('click', () => {
            // Aquí puedes mostrar el post destacado o abrir un popup con el contenido de Instagram
            mostrarPostOtakin(instaData.otakinPostUrl);
        });

        document.getElementById('infoModalBody').appendChild(btn);
    }
}

function populateModal(lugar) {
    let selectedRating = null;

    const ratings = lugar.ratings || [];
    const suma = ratings.reduce((acc, r) => acc + r.rating, 0);
    const promedio = ratings.length ? (suma / ratings.length).toFixed(1) : 'Sin votos';

    document.getElementById('modal-titulo').innerText = lugar.lugar;
    document.getElementById('modal-categoria').innerText = lugar.categoria;
    document.getElementById('modal-direccion').innerText = lugar.formatted_address ?? lugar.comuna;

    document.getElementById('modal-rating').innerHTML = `
    <span class="rating-promedio">${promedio}</span>
    <br>
    <span class="rating-votos">${ratings.length} votos</span>
  `;

    const container = document.getElementById('rating-container');
    const responseEl = document.querySelector('.rating-response');
    container.innerHTML = '';
    responseEl.innerText = '';

    // Crea estrellas
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = 'star';
        star.dataset.value = i;
        star.innerText = '★';

        star.addEventListener('click', async () => {
            if (selectedRating !== null) return; // evita múltiples envíos

            const value = parseInt(star.dataset.value);
            selectedRating = value;

            // Visual feedback
            stars.forEach((s, index) => {
                s.classList.toggle('selected', index < value);
                s.classList.add('disabled');
            });

            // Captura comentario
            const comentario = document.getElementById('floatingTextarea')?.value.trim() || null;

            // Guarda en Supabase
            const { error } = await supabase.from('ratings').insert([
                {
                    lugar_id: lugar.id,
                    rating: value,
                    comentario: comentario
                }
            ]);

            if (error) {
                responseEl.innerText = 'Error guardando rating, intenta luego.';
                console.error(error);
                return;
            }

            // Limpia textarea
            document.getElementById('floatingTextarea').value = '';

            // Actualiza promedio
            const { data: updatedRatings } = await supabase
                .from('ratings')
                .select('rating')
                .eq('lugar_id', lugar.id);

            const newSuma = updatedRatings.reduce((acc, r) => acc + r.rating, 0);
            const newProm = updatedRatings.length ? (newSuma / updatedRatings.length).toFixed(1) : 'Sin votos';

            document.getElementById('modal-rating').innerHTML = `
        <span class="rating-promedio">${newProm}</span>
        <br>
        <span class="rating-votos">${updatedRatings.length} votos</span>
      `;
        });

        container.appendChild(star);
        stars.push(star);
    }

    abrirModalConInstagram(
        lugar.lugar,
        lugar.formatted_address ?? lugar.comuna,
        lugar.categoria
    );
}
// Modal y offcanvas
document.getElementById('openModalBtn').addEventListener('click', () => {
    document.querySelectorAll('.offcanvas').forEach(el => {
        const instance = bootstrap.Offcanvas.getInstance(el);
        if (instance) instance.hide();
    });

    setTimeout(() => {
        const modal = new bootstrap.Modal(document.getElementById('submitModal'));
        modal.show();
    }, 300);
});

// Form handler
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

    const direccion = await getFormattedAddress(coords.lat, coords.lon, lugar, comuna);

    const { data, error } = await supabase.from('lugares').insert([{
        lugar,
        comuna,
        categoria,
        lat: coords.lat,
        lon: coords.lon,
        formatted_address: direccion ?? null,
    }]);

    if (error) {
        alert('Error guardando lugar. Intenta de nuevo.');
        console.error(error);
        return;
    }

    const toastEl = document.getElementById('successToast');
    const toast = new bootstrap.Toast(toastEl);
    toast.show();

    const modalEl = document.getElementById('submitModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();

    form.reset();
    loadData();
});

// Limpieza automática al cerrar el modal de agregar lugar
const modalEl = document.getElementById('submitModal');
modalEl.addEventListener('hidden.bs.modal', () => {
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = 'auto';
});


// Filtros
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


// Init
loadData();

setInterval(() => {
    const popupVisible = document.querySelector('.mapboxgl-popup.open');
    if (!popupVisible) {
        loadData();
        console.log('Mapa actualizado automáticamente');
    }
}, 90000);
