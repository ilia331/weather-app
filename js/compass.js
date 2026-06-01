// ─────────────────────────────────────────────
// COMPASS — посока на вятъра
// ─────────────────────────────────────────────

/**
 * Превръща градуси в посока (16 посоки).
 * @param {number} deg
 * @returns {string}
 */
export function getCardinal(deg) {
    const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
}

/**
 * Завърта иглата на компаса и обновява текста.
 * @param {number} deg
 */
export function updateCompass(deg) {
    document.getElementById('compassNeedle').style.transform =
        `translate(-50%, -50%) rotate(${deg}deg)`;
    document.getElementById('windDirCard').textContent = getCardinal(deg);
    document.getElementById('windDirDeg').textContent  = `${deg}°`;
}
