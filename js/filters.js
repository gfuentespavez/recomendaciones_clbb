import { loadData } from './dataLoader.js';

let activeCategory = null;
let activeComuna = null;

/**
 * Devuelve los filtros actualmente activos
 */
export function getActiveFilters() {
    return {
        category: activeCategory,
        comuna: activeComuna
    };
}

/**
 * Configura los listeners de los botones de filtro y reset
 * @param {Object} callbacks - Callbacks opcionales
 * @param {Function} callbacks.onFilterChange - Se llama cuando se aplica un filtro
 * @param {Function} callbacks.onReset - Se llama cuando se resetean los filtros
 */
export function setupFilters({ onFilterChange, onReset } = {}) {
    // Filtros por categoría
    document.querySelectorAll('.category-button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.dataset.category;
            loadData(activeCategory, activeComuna);
            if (onFilterChange) onFilterChange();
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
            if (onFilterChange) onFilterChange();
        });
    });

    // Botón de reset
    document.getElementById('resetFiltersBtn').addEventListener('click', () => {
        document.querySelectorAll('.category-button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.comuna-button').forEach(b => b.classList.remove('active'));
        activeCategory = null;
        activeComuna = null;
        loadData(null, null);
        if (onReset) onReset();
    });
}