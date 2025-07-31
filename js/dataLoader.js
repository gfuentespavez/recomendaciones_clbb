import { supabase } from './supabaseClient.js';
import { clearMarkers, addLugarMarker } from './markerManager.js';
import { map } from './map.js';

export async function loadData(category = null) {
    clearMarkers();

    let query = supabase
        .from('lugares')
        .select(`id, lugar, comuna, categoria, lat, lon, formatted_address, ratings ( rating )`);

    if (category && category !== 'all') {
        query = query.eq('categoria', category);
    }

    const { data: lugares, error } = await query;

    if (error) {
        console.error('Error cargando lugares:', error);
        return;
    }

    lugares.forEach(lugar => addLugarMarker(map, lugar));
}
