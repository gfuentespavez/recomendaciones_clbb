import { clearMarkers, addLugarMarker } from './markerManager.js';
import { supabase } from './supabaseClient.js';
import { map } from './map.js';

export async function loadData(category = null, comuna = null) {
    clearMarkers();

    let query = supabase.from('lugares').select('*');

    // Aplicar filtros según correspondan
    if (category && comuna) {
        query = query.eq('categoria', category).eq('comuna', comuna);
    } else if (category) {
        query = query.eq('categoria', category);
    } else if (comuna) {
        query = query.eq('comuna', comuna);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error al cargar lugares:', error);
        return;
    }

    data.forEach(lugar => addLugarMarker(map, lugar));
}