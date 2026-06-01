// ─────────────────────────────────────────────
// MAIN — event listeners, оркестратор, autocomplete
// ─────────────────────────────────────────────

import { geocodeCity, reverseGeocode, fetchWeatherData, fetchAutocompleteSuggestions } from './api.js';
import { initRadar }      from './radar.js';
import {
    updateUI,
    showSkeleton, hideSkeleton,
    sleep,
    isCardVisible, cardFadeOut, cardFadeIn,
    hideCard, restoreCard,
    showError, clearError
} from './ui.js';

// ── DOM референции ──────────────────────────
const cityInput      = document.getElementById('cityInput');
const searchBtn      = document.getElementById('searchBtn');
const geoBtn         = document.getElementById('geoBtn');
const autocompleteList = document.getElementById('autocompleteList');
const shareBtn       = document.getElementById('shareBtn');
const quickButtons   = document.querySelectorAll('.quick-btn');

// ── Debounce helper ──────────────────────────
function debounce(fn, delay) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

// ── Offline / Online ─────────────────────────
function onOffline() {
    showError('⚠️ Няма интернет връзка. Провери мрежата си.');
}
function onOnline() {
    clearError();
}
window.addEventListener('offline', onOffline);
window.addEventListener('online',  onOnline);
if (!navigator.onLine) onOffline();

// ─────────────────────────────────────────────
// ОСНОВНА ФУНКЦИЯ — зареди времето
// ─────────────────────────────────────────────
async function fetchWeather(cityOverride, coords) {
    const city = cityOverride || cityInput.value.trim();
    if (!city && !coords) return;

    clearError();

    // Fade-out на видимата карта
    const wasVisible = isCardVisible();
    if (wasVisible) await cardFadeOut();

    showSkeleton();
    searchBtn.textContent = '⏳';
    searchBtn.disabled    = true;

    try {
        let lat, lon, displayName;

        if (coords) {
            lat = coords.lat; lon = coords.lon;
            displayName = await reverseGeocode(lat, lon);
        } else {
            const geo = await geocodeCity(city);
            displayName = geo.name;
            lat = geo.latitude; lon = geo.longitude;
        }

        const weatherData = await fetchWeatherData(lat, lon);

        hideSkeleton();
        updateUI(displayName, weatherData);
        initRadar(lat, lon);
        cardFadeIn();

    } catch (err) {
        hideSkeleton();
        if (wasVisible) restoreCard();
        else            hideCard();
        showError(err.message || 'Възникна неочаквана грешка.');
    } finally {
        searchBtn.textContent = '🔍';
        searchBtn.disabled    = false;
    }
}

// ─────────────────────────────────────────────
// AUTOCOMPLETE
// ─────────────────────────────────────────────
let acSelectedIdx = -1;

function showAC(results) {
    acSelectedIdx = -1;
    autocompleteList.innerHTML = results.map((r, i) => `
        <li class="ac-item" role="option" aria-selected="false" data-idx="${i}" data-name="${r.name}">
            <span class="ac-city">${r.name}${r.admin1 ? `, ${r.admin1}` : ''}</span>
            <span class="ac-country">${r.country_code?.toUpperCase() || ''}</span>
        </li>
    `).join('');
    autocompleteList.style.display = 'block';

    autocompleteList.querySelectorAll('.ac-item').forEach(item => {
        item.addEventListener('mousedown', e => {
            e.preventDefault();
            const name = item.getAttribute('data-name');
            cityInput.value = name;
            hideAC();
            fetchWeather(name);
        });
    });
}

function hideAC() {
    autocompleteList.style.display = 'none';
    acSelectedIdx = -1;
}

function highlightAC(idx) {
    const items = autocompleteList.querySelectorAll('.ac-item');
    items.forEach((el, i) => {
        el.classList.toggle('ac-selected', i === idx);
        el.setAttribute('aria-selected', i === idx ? 'true' : 'false');
    });
}

const doFetchAC = debounce(async query => {
    try {
        const results = await fetchAutocompleteSuggestions(query);
        if (!results.length) { hideAC(); return; }
        showAC(results);
    } catch { hideAC(); }
}, 300);

cityInput.addEventListener('input', () => {
    const q = cityInput.value.trim();
    if (q.length < 2) { hideAC(); return; }
    doFetchAC(q);
});

// Навигация с клавиатура в autocomplete списъка
cityInput.addEventListener('keydown', e => {
    const items = autocompleteList.querySelectorAll('.ac-item');
    if (!items.length || autocompleteList.style.display === 'none') {
        if (e.key === 'Enter') fetchWeather();
        return;
    }
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        acSelectedIdx = Math.min(acSelectedIdx + 1, items.length - 1);
        highlightAC(acSelectedIdx);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        acSelectedIdx = Math.max(acSelectedIdx - 1, -1);
        highlightAC(acSelectedIdx);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (acSelectedIdx >= 0 && items[acSelectedIdx]) {
            const name = items[acSelectedIdx].getAttribute('data-name');
            cityInput.value = name;
            hideAC();
            fetchWeather(name);
        } else {
            fetchWeather();
        }
    } else if (e.key === 'Escape') {
        hideAC();
    }
});

cityInput.addEventListener('blur', () => setTimeout(hideAC, 150));
document.addEventListener('click', e => { if (!e.target.closest('.search-section')) hideAC(); });

// ─────────────────────────────────────────────
// EVENT LISTENERS
// ─────────────────────────────────────────────
searchBtn.addEventListener('click', () => fetchWeather());

geoBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        showError('Браузърът ти не поддържа геолокация.');
        return;
    }
    geoBtn.textContent = '⏳';
    geoBtn.disabled    = true;

    navigator.geolocation.getCurrentPosition(
        pos => {
            geoBtn.textContent = '📍';
            geoBtn.disabled    = false;
            fetchWeather(null, { lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        err => {
            geoBtn.textContent = '📍';
            geoBtn.disabled    = false;
            const msgs = {
                1: 'Отказа достъп до местоположението.',
                2: 'Местоположението не може да бъде определено.',
                3: 'Заявката за местоположение изтече.'
            };
            showError(msgs[err.code] || 'Неуспешна геолокация.');
        }
    );
});

quickButtons.forEach(btn => btn.addEventListener('click', () => {
    const city = btn.getAttribute('data-city');
    cityInput.value = city;
    fetchWeather(city);
}));

// ─────────────────────────────────────────────
// SHARE BUTTON
// ─────────────────────────────────────────────
shareBtn.addEventListener('click', async () => {
    const city      = document.getElementById('cityName').textContent;
    const temp      = document.getElementById('temperature').textContent;
    const desc      = document.getElementById('weatherDesc').textContent;
    const feelsLike = document.getElementById('feelsLike').textContent;
    const humidity  = document.getElementById('humidity').textContent;
    const wind      = document.getElementById('windSpeed').textContent;

    const text =
        `📍 ${city}\n` +
        `🌡 ${temp}°C · ${desc}\n` +
        `✨ Усещане: ${feelsLike}\n` +
        `💧 Влажност: ${humidity}\n` +
        `💨 Вятър: ${wind}`;

    try {
        if (navigator.share) {
            await navigator.share({ title: `Времето в ${city}`, text });
        } else {
            await navigator.clipboard.writeText(text);
            shareBtn.textContent = '✅';
            setTimeout(() => { shareBtn.textContent = '🔗'; }, 2200);
        }
    } catch { /* потребителят е отказал */ }
});

// ─────────────────────────────────────────────
// СТАРТ
// ─────────────────────────────────────────────
window.addEventListener('load', () => fetchWeather('Sofia'));
