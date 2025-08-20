import { SUPABASE_KEY, SUPABASE_FUNCTION_URL } from './supabaseClient.js';

/**
 * Geocodifica un lugar usando la Edge Function de Supabase.
 * @param {string} lugar - Nombre del lugar
 * @param {string} comuna - Comuna
 * @returns {Promise<{lat:number, lon:number} | null>}
 */

export async function geocodeLugar(lugar, comuna) {
    if (!lugar || !comuna) {
        console.warn("Lugar o comuna faltante:", { lugar, comuna });
        return null;
    }

    const query = `${lugar}, ${comuna}, Biobío, Chile`;
    console.log("Buscando geocodificación para:", query);

    try {
        const body = { provider: "google", q: query };

        const res = await fetch(SUPABASE_FUNCTION_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${SUPABASE_KEY}` // 👈 esto es lo que evita el 401
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const { data } = await res.json();

        console.log("Respuesta de geocodificación:", data);

        const location = data?.results?.[0]?.geometry?.location;

        if (!location) {
            console.warn("No se encontraron coordenadas válidas.");
            return null;
        }

        console.log("Coordenadas encontradas:", location);

        return {
            lat: location.lat,
            lon: location.lng
        };

    } catch (err) {
        console.error("Error en geocodeLugar:", err);
        return null;
    }
}

/**
 * Reverse geocoding usando Mapbox vía Edge Function
 * @param {number} lon
 * @param {number} lat
 * @returns {Promise<any|null>}
 */
export async function reverseGeocodeMapbox(lon, lat) {
    if (lon === undefined || lat === undefined) return null;

    try {
        const body = { provider: "mapbox", lon, lat };

        const res = await fetch(SUPABASE_FUNCTION_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const { data } = await res.json();
        return data || null;

    } catch (err) {
        console.error("Error en reverseGeocodeMapbox:", err);
        return null;
    }
}