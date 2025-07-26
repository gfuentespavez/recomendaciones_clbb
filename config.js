mapboxgl.accessToken = 'pk.eyJ1IjoiZ2VybWFuZnVlbnRlcyIsImEiOiJjbWN4eG5vbzAwam90Mmpva2lqeWZteXUxIn0._4skowp2WM5yDc_sywRDkA';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/germanfuentes/cmcybcvt501b001s4473g8ttb',
    center: [-73.05879, -36.83002],
    zoom: 16.73,
    pitch: 63,
    bearing: -109.48,
});

//Google Maps geocoding
async function geocodeLugar(lugar, comuna) {
    const address = encodeURIComponent(`${lugar}, ${comuna}, Biobío, Chile`);
    const apiKey = "AIzaSyCUHq2VQ7GkWvOKDMGvyJE2k_cZ4IWHsLU";

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



//URL de la planilla con las respuestas del formulario
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSEWU3mkFfjXHoGUgAAREbj9ErgeYqEfUSmajwtfuI5fRWeLAJc6c2-hjisrWFY-Sybv-Gtr1VbAWLo/pub?output=csv';

let markers = [];

function loadData(category = null) {
    markers.forEach(m => m.remove());
    markers = [];

    const categoryKey = 'Categoría';

    fetch(csvUrl)
        .then(response => response.text())
        .then(csvText => {
            const parsed = Papa.parse(csvText, { header: true });
            const data = parsed.data.filter(r => r.Latitude && r.Longitude);

            data.forEach(row => {
                const rowCategory = (row[categoryKey] || '').trim();
                const selectedCategory = (category || '').trim();

                if (selectedCategory && selectedCategory !== 'all' && rowCategory !== selectedCategory) return;

                const lat = parseFloat((row.Latitude || '').trim());
                const lon = parseFloat((row.Longitude || '').trim());
                if (isNaN(lat) || isNaN(lon)) return;

                const el = document.createElement('div');
                el.innerHTML = `<img src="assets/svg/pin.svg" style="width: 40px; height: 40px; cursor: pointer;" />`;

                const popupHTML = `
  <h3>📍 ${row.Lugar}</h3>
  <p>Comuna: ${row.Comuna}</p>
  <p>Categoría: ${row.Categoría}</p>
`;


                const marker = new mapboxgl.Marker({ element: el })
                    .setLngLat([lon, lat])
                    .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popupHTML))
                    .addTo(map);

                markers.push(marker);
            });
        });
}

document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const category = btn.getAttribute('data-category');
        loadData(category);
    });
});


loadData()

// Refrescar el mapa cada 30 segundos (60000 ms)
setInterval(() => {
    loadData();
    console.log('Mapa actualizado automáticamente');
}, 30000);

//Listener
document.getElementById('submitForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const form = e.target;

    const lugar = form.querySelector('[name="entry.914674059"]').value;
    const comuna = form.querySelector('[name="entry.1168797881"]').value;

    const coords = await geocodeLugar(lugar, comuna);

    if (!coords) {
        alert('No pudimos geolocalizar el lugar. Intenta ser más específico.');
        return;
    }

    // ✅ Actualizar inputs ocultos directamente en el DOM
    document.getElementById('latitude').value = coords.lat;
    document.getElementById('longitude').value = coords.lon;

    // ✅ Crear el FormData DESPUÉS de actualizar los inputs
    const formData = new FormData(form);
    const query = new URLSearchParams(formData).toString();

    fetch(form.action, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: query
    }).then(() => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('submitModal'));
        modal.hide();
        form.reset();

        const toast = new bootstrap.Toast(document.getElementById('successToast'));
        toast.show();

        loadData();
    });
})
const openMenuBtn = document.getElementById("openMenuBtn");
const closeMenuBtn = document.getElementById("closeMenuBtn");
const menuOffcanvas = document.getElementById("menuOffcanvas");
const mainFabMenu = document.getElementById("main-fab-menu");

// Abrir menú
openMenuBtn.addEventListener("click", () => {
    menuOffcanvas.classList.add("show");
    menuOffcanvas.style.display = "flex";
    mainFabMenu.style.display = "none";
});

// Cerrar menú
closeMenuBtn.addEventListener("click", () => {
    menuOffcanvas.classList.remove("show");
    // Esperar la transición antes de ocultar display
    setTimeout(() => {
        menuOffcanvas.style.display = "none";
    }, 400);
    mainFabMenu.style.display = "block";
});

// Filtrar por categoría y cerrar menú
document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const category = btn.getAttribute('data-category');
        loadData(category); // función que carga/filtra el mapa

        menuOffcanvas.classList.remove("show");
        setTimeout(() => {
            menuOffcanvas.style.display = "none";
        }, 400);
        mainFabMenu.style.display = "block";
    });
});

// Al abrir modal desde menú: cerrar menú y mostrar FAB
document.getElementById("openModalBtn").addEventListener("click", () => {
    menuOffcanvas.classList.remove("show");
    setTimeout(() => {
        menuOffcanvas.style.display = "none";
    }, 400);
    mainFabMenu.style.display = "block";
});