export async function callFindInstagram(lugar, direccion, categoria) {
    // construyes el query params con lugar, direccion y categoria
    const params = new URLSearchParams({
        lugar,
        direccion,
        categoria
    });

    const url = `https://bkoupsifunrusaixmxvn.supabase.co/functions/v1/find-instagram?${params.toString()}`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Error llamando la función:', res.status, errorText);
            return null;
        }
        return await res.json();
    } catch (error) {
        console.error('Fetch falló:', error);
        return null;
    }
}