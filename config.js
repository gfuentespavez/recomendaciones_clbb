mapboxgl.accessToken = 'pk.eyJ1IjoiZ2VybWFuZnVlbnRlcyIsImEiOiJjbWN4eG5vbzAwam90Mmpva2lqeWZteXUxIn0._4skowp2WM5yDc_sywRDkA';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/germanfuentes/cmcybcvt501b001s4473g8ttb',
    center: [-73.05, -36.82],
    zoom: 12
});

const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRUV15h0Y_u0KtUYdOcc_WiIEzNe_xMdvaAxODqfg8NtIuBQ1gkRghUEwsRYH7aHgBbtmjS49c4AORu/pub?output=csv';

let markers = [];

function loadData(category = null) {
    markers.forEach(m => m.remove());
    markers = [];

    const categoryKey = '¿En qué categoría recomiendas este lugar?';

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
                el.style.width = '18px';
                el.style.height = '18px';
                el.style.borderRadius = '50%';
                el.style.backgroundColor = '#ffcc05';
                el.style.border = '2px solid white';

                const popupHTML = `
          <h3>📍 ${row.Lugar}</h3>
          <p>${row.Comentario}</p>
          <span>${row.Usuario}</span>
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


document.getElementById('submitForm').addEventListener('submit', function (e) {
    e.preventDefault(); // Evita que se recargue o abra otra pestaña

    const form = e.target;
    const formData = new FormData(form);
    const query = new URLSearchParams(formData).toString();

    fetch(form.action, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: query
    }).then(() => {
        // Cierra el modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('submitModal'));
        modal.hide();

        // Limpia el form
        form.reset();

        // Muestra el toast
        const toast = new bootstrap.Toast(document.getElementById('successToast'));
        toast.show();

        // Vuelve a cargar los datos del mapa
        loadData();
    });
});
