import { geocodeLugar } from './geocoding.js';
import { getFormattedAddress } from './places.js';
import { supabase } from './supabaseClient.js';
import { loadData } from './dataLoader.js';

export function setupForm() {
    const form = document.getElementById('submitForm');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const lugar = form.lugar.value.trim();
        const comuna = form.comuna.value.trim();
        const categoria = form.categoria.value.trim();

        if (!lugar || !comuna || !categoria) {
            alert('Por favor completa todos los campos.');
            return;
        }

        const coords = await geocodeLugar(lugar, comuna);
        if (!coords) {
            alert('No pudimos geolocalizar el lugar. Intenta ser más específico.');
            return;
        }

        const direccion = await getFormattedAddress(coords.lat, coords.lon, lugar, comuna);

        const { data, error } = await supabase.from('lugares').insert([{
            lugar,
            comuna,
            categoria,
            lat: coords.lat,
            lon: coords.lon,
            formatted_address: direccion ?? null,
        }]);

        if (error) {
            alert('Error guardando lugar. Intenta de nuevo.');
            console.error(error);
            return;
        }

        const toastEl = document.getElementById('successToast');
        const toast = new bootstrap.Toast(toastEl);
        toast.show();

        const modalEl = document.getElementById('submitModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

        form.reset();
        loadData();
    });

    // Limpieza automática al cerrar el modal
    const modalEl = document.getElementById('submitModal');
    modalEl.addEventListener('hidden.bs.modal', () => {
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = 'auto';
    });
}
