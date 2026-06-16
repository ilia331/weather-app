const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse';

// Converts a city name into coordinates for the weather API.
export async function geocodeCity(city) {
    const res = await fetch(`${GEO_URL}?name=${encodeURIComponent(city)}&count=1`);
    if (!res.ok) throw new Error('Could not connect to the geocoding service.');

    const data = await res.json();
    if (!data.results?.length) throw new Error(`City "${city}" was not found.`);

    const r = data.results[0];
    return {
        name: `${r.name}, ${r.country}`,
        latitude: r.latitude,
        longitude: r.longitude
    };
}

// Converts coordinates back into a readable place name.
export async function reverseGeocode(lat, lon) {
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const res = await fetch(`${NOMINATIM}?lat=${lat}&lon=${lon}&format=json`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            const a = data.address || {};
            const city = a.city || a.town || a.village || a.county || 'Your Location';
            const cc = a.country_code?.toUpperCase() || '';
            return cc ? `${city}, ${cc}` : city;
        } catch {
            if (attempt === 2) return 'Your Location';
            await new Promise(resolve => setTimeout(resolve, 600));
        }
    }
}

// Loads current, hourly, and daily weather data for one location.
export async function fetchWeatherData(lat, lon) {
    const url =
        `${WEATHER_URL}` +
        `?latitude=${lat}&longitude=${lon}` +
        `&current_weather=true` +
        `&daily=sunrise,sunset` +
        `&hourly=relativehumidity_2m,temperature_2m,apparent_temperature` +
        `&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Could not load the weather data.');
    return res.json();
}

// Finds city suggestions while the user types.
export async function fetchAutocompleteSuggestions(query) {
    const res = await fetch(`${GEO_URL}?name=${encodeURIComponent(query)}&count=6`);
    if (!res.ok) return [];

    const data = await res.json();
    return data.results || [];
}
