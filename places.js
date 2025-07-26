// places.js

/**
 * Busca el place_id más cercano a las coordenadas dadas usando Nearby Search.
 * @param {number} lat - Latitud del lugar.
 * @param {number} lon - Longitud del lugar.
 * @returns {Promise<string|null>} - El place_id si se encuentra, o null.
 */
export async function getPlaceId(lat, lon) {
    const location = new google.maps.LatLng(lat, lon);
    const service = new google.maps.places.PlacesService(document.createElement('div'));

    const request = {
        location: location,
        radius: 50, // metros
        rankBy: google.maps.places.RankBy.PROMINENCE,
        type: "point_of_interest"
    };

    return new Promise((resolve, reject) => {
        service.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
                resolve(results[0].place_id);
            } else {
                console.warn("No se encontró place_id:", status);
                resolve(null);
            }
        });
    });
}

/**
 * Obtiene detalles del lugar desde Google Places usando el SDK.
 * @param {string} placeId - ID del lugar.
 * @returns {Promise<object|null>} - Detalles del lugar o null.
 */
export async function getPlaceDetailsViaSDK(placeId) {
    const service = new google.maps.places.PlacesService(document.createElement('div'));

    const request = {
        placeId: placeId,
        fields: ["name", "rating", "formatted_address", "user_ratings_total"]
    };

    return new Promise((resolve, reject) => {
        service.getDetails(request, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                resolve(place);
            } else {
                console.error("Error en getDetails:", status);
                resolve(null);
            }
        });
    });
}

/**
 * Genera HTML enriquecido para el popup con datos de Google Places.
 * @param {number} lat - Latitud del lugar.
 * @param {number} lon - Longitud del lugar.
 * @returns {Promise<string>} - HTML con rating y reseña.
 */
export async function buildPlaceDetailsHTML(lat, lon) {
    const placeId = await getPlaceId(lat, lon);
    if (!placeId) return '';

    const details = await getPlaceDetailsViaSDK(placeId);
    if (!details) return '';

    const rating = details.rating || 'N/A';
    const total = details.user_ratings_total || 0;

    return `
        <p>⭐ <strong>Rating:</strong> ${rating} (${total} reseñas)</p>
    `;
}
