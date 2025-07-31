import { loadData } from './dataLoader.js';

export function setupFilters() {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadData(btn.dataset.category);
        });
    });

    document.getElementById('resetFiltersBtn').addEventListener('click', () => {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        loadData(null);
    });
}
