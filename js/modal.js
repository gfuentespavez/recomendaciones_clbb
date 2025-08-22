import { supabase } from './supabaseClient.js';

//Modal con info del lugar
export async function populateModal(lugar) {
    let selectedRating = null;

    const ratings = lugar.ratings || [];
    const suma = ratings.reduce((acc, r) => acc + r.rating, 0);
    const promedio = ratings.length ? (suma / ratings.length).toFixed(1) : 'Sin votos';

    document.getElementById('modal-titulo').innerText = lugar.lugar;
    document.getElementById('modal-categoria').innerText = lugar.categoria;
    document.getElementById('modal-direccion').innerText = lugar.formatted_address ?? lugar.comuna;

    document.getElementById('modal-rating').innerHTML = `
        <span class="rating-promedio">${promedio}</span>
        <br>
        <span class="rating-votos">${ratings.length} votos</span>
    `;

    const container = document.getElementById('rating-container');
    const responseEl = document.querySelector('.rating-response');
    container.innerHTML = '';
    responseEl.innerText = '';

    // Crear estrellas de rating
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = 'star';
        star.dataset.value = i;
        star.innerText = '★';

        star.addEventListener('click', async () => {
            if (selectedRating !== null) return;

            const value = parseInt(star.dataset.value);
            selectedRating = value;

            // Visual feedback
            stars.forEach((s, index) => {
                s.classList.toggle('selected', index < value);
                s.classList.add('disabled');
            });

            const comentario = document.getElementById('floatingTextarea')?.value.trim() || null;

            const { error } = await supabase.from('ratings').insert([
                {
                    lugar_id: lugar.id,
                    rating: value,
                    comentario: comentario
                }
            ]);

            if (error) {
                responseEl.innerText = 'Error guardando rating, intenta luego.';
                console.error(error);
                return;
            }

            document.getElementById('floatingTextarea').value = '';

            const { data: updatedRatings } = await supabase
                .from('ratings')
                .select('rating')
                .eq('lugar_id', lugar.id);

            const newSuma = updatedRatings.reduce((acc, r) => acc + r.rating, 0);
            const newProm = updatedRatings.length ? (newSuma / updatedRatings.length).toFixed(1) : 'Sin votos';

            document.getElementById('modal-rating').innerHTML = `
                <span class="rating-promedio">${newProm}</span>
                <br>
                <span class="rating-votos">${updatedRatings.length} votos</span>
            `;
        });

        container.appendChild(star);
        stars.push(star);
    }
}