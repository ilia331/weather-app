// ─────────────────────────────────────────────
// RADAR — жива карта с валежи (Leaflet + RainViewer)
// ─────────────────────────────────────────────

let map;

/**
 * Инициализира (или презарежда) радарната карта.
 * @param {number} lat
 * @param {number} lon
 */
export function initRadar(lat, lon) {
    // Leaflet е глобална CDN библиотека
    const L = window.L;
    if (map) map.remove();
    map = L.map('radarMap').setView([lat, lon], 7);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);

    L.tileLayer('https://tilecache.rainviewer.com/v2/radar/nowcast_0/256/{z}/{x}/{y}/2/1_1.png', {
        tileSize: 256,
        opacity:  0.6,
        attribution: 'RainViewer'
    }).addTo(map);
}
