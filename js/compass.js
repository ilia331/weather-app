// Converts wind degrees into a 16-point compass direction.
export function getCardinal(deg) {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
}

// Rotates the compass needle and updates its text labels.
export function updateCompass(deg) {
    document.getElementById('compassNeedle').style.transform =
        `translate(-50%, -50%) rotate(${deg}deg)`;
    document.getElementById('windDirCard').textContent = getCardinal(deg);
    document.getElementById('windDirDeg').textContent = `${deg}°`;
}
