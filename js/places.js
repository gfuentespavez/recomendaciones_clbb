// places.js

/**
 * Busca el place_id usando findPlaceFromQuery (texto).
 * @param {string} lugar
 * @param {string} comuna
 * @returns {Promise<string|null>}
 */
export async function getPlaceIdByText(lugar, comuna) {
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    const query = `${lugar}, ${comuna}, Biobío, Chile`;

    return new Promise((resolve) => {
        service.findPlaceFromQuery({
            query: query,
            fields: ['place_id']
        }, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
                resolve(results[0].place_id);
            } else {
                console.warn("[Places] No place_id por texto:", status);
                resolve(null);
            }
        });
    });
}

/**
 * Busca el place_id usando nearbySearch (coordenadas).
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<string|null>}
 */
export async function getPlaceIdByCoords(lat, lon) {
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    const location = new google.maps.LatLng(lat, lon);

    const request = {
        location,
        radius: 50,
        rankBy: google.maps.places.RankBy.PROMINENCE,
        type: "point_of_interest"
    };

    return new Promise((resolve) => {
        service.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
                resolve(results[0].place_id);
            } else {
                console.warn("[Places] No place_id por coords:", status);
                resolve(null);
            }
        });
    });
}

/**
 * Obtiene detalles del lugar.
 * @param {string} placeId
 * @returns {Promise<object|null>}
 */
export async function getPlaceDetails(placeId) {
    const service = new google.maps.places.PlacesService(document.createElement('div'));

    return new Promise((resolve) => {
        service.getDetails({
            placeId,
            fields: ['name', 'rating', 'user_ratings_total', 'types', 'formatted_address'] // ✅ corregido
        }, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                resolve(place);
            } else {
                console.error("[Places] Error getDetails:", status);
                resolve(null);
            }
        });
    });
}

/**
 * Convierte los tipos a etiquetas legibles.
 * @param {string[]} types
 * @returns {string}
 */
function mapTypesToReadable(types) {
    if (!Array.isArray(types)) return '';
    const map = {
        restaurant: 'Restaurante',
        bar: 'Bar',
        cafe: 'Cafetería',
        bakery: 'Panadería',
        meal_takeaway: 'Comida para llevar',
        meal_delivery: 'Delivery',
        food: 'Comida',
        grocery_or_supermarket: 'Supermercado',
        store: 'Tienda',
        point_of_interest: 'Punto de interés',
        establishment: 'Establecimiento',
    };

    const readable = types
        .map(t => map[t] || t.replace(/_/g, ' '))
        .filter(Boolean);

    return [...new Set(readable)].join(', ');
}

/**
 * Construye el HTML del popup con info de Places.
 * @param {number} lat
 * @param {number} lon
 * @param {string} lugar
 * @param {string} comuna
 * @returns {Promise<string>}
 */
export async function buildPlaceDetailsHTML(lat, lon, lugar, comuna) {
    let placeId = await getPlaceIdByText(lugar, comuna);
    if (!placeId) {
        placeId = await getPlaceIdByCoords(lat, lon);
    }
    if (!placeId) {
        console.warn("[Places] No se pudo obtener placeId para:", lugar, comuna);
        return '';
    }

    const details = await getPlaceDetails(placeId);
    if (!details) {
        console.warn("[Places] No se pudo obtener detalles para placeId:", placeId);
        return '';
    }

    const rating = details.rating ?? 'N/A';
    const total = details.user_ratings_total ?? 0;
    const readableTypes = mapTypesToReadable(details.types);

    return `
        <p>⭐ <strong>Rating:</strong> ${rating} (${total} reseñas)</p>
        ${readableTypes ? `<p>🍽️ Tipo: ${readableTypes}</p>` : ''}
    `;
}

/**
 * Obtiene la dirección formateada desde Places API.
 * @param {number} lat
 * @param {number} lon
 * @param {string} lugar
 * @param {string} comuna
 * @returns {Promise<string|null>}
 */
export async function getFormattedAddress(lat, lon, lugar, comuna) {
    let placeId = await getPlaceIdByText(lugar, comuna) || await getPlaceIdByCoords(lat, lon);
    if (!placeId) {
        console.warn("[Places] No se pudo obtener placeId para:", lugar, comuna);
        return null;
    }

    const service = new google.maps.places.PlacesService(document.createElement('div'));
    return new Promise((resolve) => {
        service.getDetails({
            placeId,
            fields: ['formatted_address']
        }, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place?.formatted_address) {
                resolve(place.formatted_address);
            } else {
                console.warn("[Places] No se pudo obtener dirección para:", placeId);
                resolve(null);
            }
        });
    });
}
