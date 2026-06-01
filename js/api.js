// ─────────────────────────────────────────────
// API — всички заявки към външни услуги
// ─────────────────────────────────────────────

const GEO_URL     = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
const NOMINATIM   = 'https://nominatim.openstreetmap.org/reverse';

/**
 * Геокодира град по име. Връща { name, country, latitude, longitude }.
 * @param {string} city
 */
export async function geocodeCity(city) {
    const res  = await fetch(`${GEO_URL}?name=${encodeURIComponent(city)}&count=1`);
    if (!res.ok) throw new Error('Грешка при свързване с геокодиращата услуга.');
    const data = await res.json();
    if (!data.results?.length) throw new Error(`Градът „${city}" не беше намерен.`);
    const r = data.results[0];
    return { name: `${r.name}, ${r.country}`, latitude: r.latitude, longitude: r.longitude };
}

/**
 * Обратно геокодиране — координати → название на място.
 * При неуспех прави втори опит, после връща 'Твоето местоположение'.
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<string>}
 */
export async function reverseGeocode(lat, lon) {
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const res  = await fetch(`${NOMINATIM}?lat=${lat}&lon=${lon}&format=json`);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            const a    = data.address || {};
            const city = a.city || a.town || a.village || a.county || 'Твоето местоположение';
            const cc   = a.country_code?.toUpperCase() || '';
            return cc ? `${city}, ${cc}` : city;
        } catch (err) {
            if (attempt === 2) return 'Твоето местоположение';
            await new Promise(r => setTimeout(r, 600));
        }
    }
}

/**
 * Изтегля прогнозата за времето за дадени координати.
 * @param {number} lat
 * @param {number} lon
 */
export async function fetchWeatherData(lat, lon) {
    const url =
        `${WEATHER_URL}` +
        `?latitude=${lat}&longitude=${lon}` +
        `&current_weather=true` +
        `&daily=sunrise,sunset` +
        `&hourly=relativehumidity_2m,temperature_2m,apparent_temperature` +
        `&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Грешка при зареждане на данните за времето.');
    return res.json();
}

/**
 * Автодовършване — връща масив с до 6 резултата за подадения низ.
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function fetchAutocompleteSuggestions(query) {
    const res  = await fetch(`${GEO_URL}?name=${encodeURIComponent(query)}&count=6`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
}
