const apiKey = "AIzaSyCUHq2VQ7GkWvOKDMGvyJE2k_cZ4IWHsLU";
const proxyUrl = "https://cors-anywhere.herokuapp.com/";

async function fetchPlaceDetails(lat, lon, placeName) {
    try {
        const nearbySearchUrl = `${proxyUrl}https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=50&type=point_of_interest&keyword=${encodeURIComponent(placeName)}&key=${apiKey}`;
        const resSearch = await fetch(nearbySearchUrl);
        const dataSearch = await resSearch.json();

        if (dataSearch.status !== "OK" || dataSearch.results.length === 0) {
            console.log("No se encontraron resultados Nearby Search:", dataSearch.status);
            return null;
        }

        const placeId = dataSearch.results[0].place_id;

        const placeDetailsUrl = `${proxyUrl}https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,formatted_address,types&key=${apiKey}`;
        const resDetails = await fetch(placeDetailsUrl);
        const dataDetails = await resDetails.json();

        if (dataDetails.status !== "OK") {
            console.log("Error en Place Details:", dataDetails.status);
            return null;
        }

        return dataDetails.result;
    } catch (error) {
        console.error("Error fetchPlaceDetails:", error);
        return null;
    }
}

// Esta función debe llamarse después de que el mapa y los markers estén cargados
function setupPopupEnhancer(map) {
    map.on('popupopen', async (e) => {
        const popup = e.popup;
        const lngLat = popup.getLngLat();

        // Obtener nombre del lugar del popup original (asumiendo formato conocido)
        const placeNameMatch = popup.getHTML().match(/📍\s*(.*?)<\/h3>/);
        const placeName = placeNameMatch ? placeNameMatch[1] : "";

        if (!placeName) return;

        const details = await fetchPlaceDetails(lngLat.lat, lngLat.lng, placeName);

        if (details) {
            let stars = "";
            if (details.rating) {
                const rounded = Math.round(details.rating);
                stars = "⭐".repeat(rounded) + ` (${details.rating} / 5)`;
            } else {
                stars = "Sin calificación";
            }

            const newHtml = `
        <h3>📍 ${details.name}</h3>
        <p>${stars}</p>
        <p>${details.formatted_address || ""}</p>
        <p>${details.types ? details.types.join(", ") : ""}</p>
      `;

            popup.setHTML(newHtml);
        }
    });
}

// Exporta la función para usar en config.js o donde instancies el mapa
export { setupPopupEnhancer };
