
function createSVGMarker(url) {
    const el = document.createElement('div');
    el.className = 'custom-marker';

    const img = document.createElement('img');
    img.src = url;
    img.style.width = '30px';    // Tamaño del ícono, ajusta si quieres
    img.style.height = '30px';
    img.style.userSelect = 'none';
    img.style.pointerEvents = 'auto'; // Que el mouse funcione

    el.appendChild(img);
    return el;
}

// Función que añade marcadores al mapa, solo "Cerveza"
function addCustomMarkers(map, lugares) {
    lugares.forEach(lugar => {
        if (lugar.categoria === 'Cerveza') {
            const markerEl = createSVGMarker('assets/svg/beer.svg');

            new mapboxgl.Marker(markerEl)
                .setLngLat([lugar.lon, lugar.lat])
                .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(lugar.nombre))
                .addTo(map);
        }
    });
}

// Exporta la función para usar desde otro JS (si usas módulos)
// export { addCustomMarkers };

// Si no usas módulos, asigna globalmente:
// window.addCustomMarkers = addCustomMarkers;
