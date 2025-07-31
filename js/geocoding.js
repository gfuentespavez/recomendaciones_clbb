import { GOOGLE_MAPS_API_KEY } from './secrets.js';

export async function geocodeLugar(lugar, comuna) {
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
