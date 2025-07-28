// ==================== SUPABASE INIT ====================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://bkoupsifunrusaixmxvn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrb3Vwc2lmdW5ydXNhaXhteHZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NzA2OTgsImV4cCI6MjA2OTI0NjY5OH0.lnsuc_zdJkJbztzXf3__Z-7CipGYE6OtkbAmJoLCC14';
const supabase = createClient(supabaseUrl, supabaseKey);

let markers = [];

// ==================== MAP INIT ====================
mapboxgl.accessToken = 'pk.eyJ1IjoiZ2VybWFuZnVlbnRlcyIsImEiOiJjbWN4eG5vbzAwam90Mmpva2lqeWZteXUxIn0._4skowp2WM5yDc_sywRDkA';

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
    const apiKey = "AIzaSyCwNsIode9P9Aa1ZPhkMtN9n1DGVwSsDZg";
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apiKey}`;

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
        <p>Rating promedio: 🌟 ${promedio} / 5 (${ratings.length} votos)</p>

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

// ==================== STAR RATING HANDLER ====================
map.on('popupopen', () => {
    const popup = document.querySelector('.mapboxgl-popup-content .popup-content');
    if (!popup) return;

    const stars = popup.querySelectorAll('.star');
    const response = popup.querySelector('.rating-response');
    const lugarId = popup.dataset.id;

    stars.forEach(star => {
        star.onclick = async () => {
            const value = parseInt(star.dataset.value);

            const { error } = await supabase.from('ratings').insert([
                { lugar_id: lugarId, rating: value }
            ]);

            if (error) {
                response.innerText = 'Error guardando rating, intenta luego.';
                console.error(error);
                return;
            }

            response.innerText = `Gracias por calificar con ${value} ⭐`;
            loadData();
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
        btn.classList.add('active');xw
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
    loadData();
    console.log('Mapa actualizado automáticamente');
}, 30000);