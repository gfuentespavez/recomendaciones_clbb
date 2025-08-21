import { loadData } from './dataLoader.js';

let activeCategory = null;
let activeComuna = null;

export function setupFilters() {
    // Filtros por categoría
    document.querySelectorAll('.category-button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.dataset.category;
            loadData(activeCategory, activeComuna);
        });
    });

    // Filtros por comuna
    document.querySelectorAll('.comuna-button').forEach(btn => {
        btn.addEventListener('click', () => {
            console.log('Botón comuna clickeado: ', btn.dataset.comuna);
            document.querySelectorAll('.comuna-button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeComuna = btn.dataset.comuna;
            loadData(activeCategory, activeComuna);
        });
    });

    // Resetear filtros
    document.getElementById('resetFiltersBtn').addEventListener('click', () => {
        document.querySelectorAll('.category-button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.comuna-button').forEach(b => b.classList.remove('active'));
        activeCategory = null;
        activeComuna = null;
        loadData(null, null);
    });
}
