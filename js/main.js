import { geocodeCity, reverseGeocode, fetchWeatherData, fetchAutocompleteSuggestions } from './api.js';
import {
    updateUI,
    showSkeleton,
    hideSkeleton,
    sleep,
    isCardVisible,
    cardFadeOut,
    cardFadeIn,
    hideCard,
    restoreCard,
    showError,
    clearError,
    setTemperatureUnit,
    getTemperatureUnit
} from './ui.js';

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const geoBtn = document.getElementById('geoBtn');
const unitToggle = document.getElementById('unitToggle');
const autocompleteList = document.getElementById('autocompleteList');
const shareBtn = document.getElementById('shareBtn');
const quickButtons = document.querySelectorAll('.quick-btn');
const historySection = document.getElementById('historySection');
const historyList = document.getElementById('historyList');
const HISTORY_KEY = 'weatherSearchHistory';
const MAX_HISTORY_ITEMS = 5;

// Delays rapid calls so autocomplete only searches after the user pauses typing.
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

// Keeps network status errors visible without interrupting the page flow.
function onOffline() {
    showError('No internet connection. Please check your network.');
}

function onOnline() {
    clearError();
}

window.addEventListener('offline', onOffline);
window.addEventListener('online', onOnline);
if (!navigator.onLine) onOffline();

// Reads the last successful city searches from localStorage.
function getSearchHistory() {
    try {
        const items = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        return Array.isArray(items) ? items.slice(0, MAX_HISTORY_ITEMS) : [];
    } catch {
        return [];
    }
}

// Renders recent searches as quick buttons under the search bar.
function renderSearchHistory() {
    const items = getSearchHistory();
    historySection.style.display = items.length ? 'block' : 'none';
    historyList.replaceChildren();

    items.forEach(city => {
        const button = document.createElement('button');
        button.className = 'history-btn';
        button.type = 'button';
        button.dataset.city = city;
        button.textContent = city;
        historyList.append(button);
    });
}

// Saves a successful text search and keeps only the five newest unique entries.
function addSearchHistory(city) {
    if (!city) return;
    const normalizedCity = city.trim();
    const items = getSearchHistory().filter(item => item.toLowerCase() !== normalizedCity.toLowerCase());
    items.unshift(normalizedCity);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY_ITEMS)));
    renderSearchHistory();
}

// Loads weather data, updates the card, and stores successful city searches.
async function fetchWeather(cityOverride, coords) {
    const city = cityOverride || cityInput.value.trim();

    if (!city && !coords) {
        showError('Please enter a city name before searching.');
        cityInput.focus();
        return;
    }

    clearError();

    const wasVisible = isCardVisible();
    if (wasVisible) await cardFadeOut();

    showSkeleton();
    searchBtn.textContent = 'Loading';
    searchBtn.disabled = true;

    try {
        let lat;
        let lon;
        let displayName;

        if (coords) {
            lat = coords.lat;
            lon = coords.lon;
            displayName = await reverseGeocode(lat, lon);
        } else {
            const geo = await geocodeCity(city);
            displayName = geo.name;
            lat = geo.latitude;
            lon = geo.longitude;
        }

        const weatherData = await fetchWeatherData(lat, lon);

        hideSkeleton();
        updateUI(displayName, weatherData);
        if (!coords) addSearchHistory(displayName);
        cardFadeIn();
    } catch (err) {
        hideSkeleton();
        if (wasVisible) restoreCard();
        else hideCard();
        showError(err.message || 'An unexpected error occurred.');
    } finally {
        searchBtn.textContent = 'Search';
        searchBtn.disabled = false;
    }
}

let acSelectedIdx = -1;

// Shows autocomplete results and lets the user select a city directly.
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

// Hides autocomplete and clears keyboard selection state.
function hideAC() {
    autocompleteList.style.display = 'none';
    acSelectedIdx = -1;
}

// Moves the visual selection while navigating autocomplete with the keyboard.
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
        if (!results.length) {
            hideAC();
            return;
        }
        showAC(results);
    } catch {
        hideAC();
    }
}, 300);

cityInput.addEventListener('input', () => {
    const q = cityInput.value.trim();
    clearError();
    if (q.length < 2) {
        hideAC();
        return;
    }
    doFetchAC(q);
});

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
document.addEventListener('click', e => {
    if (!e.target.closest('.search-section')) hideAC();
});

searchBtn.addEventListener('click', () => fetchWeather());

// Switches between Celsius and Fahrenheit without fetching new weather data.
unitToggle.addEventListener('click', () => {
    const nextUnit = getTemperatureUnit() === 'C' ? 'F' : 'C';
    setTemperatureUnit(nextUnit);
    unitToggle.textContent = nextUnit === 'C' ? '°F' : '°C';
    unitToggle.setAttribute(
        'aria-label',
        nextUnit === 'C' ? 'Show temperatures in Fahrenheit' : 'Show temperatures in Celsius'
    );
    unitToggle.title = nextUnit === 'C' ? 'Show Fahrenheit' : 'Show Celsius';
});

// Uses browser geolocation when available, then fetches weather for those coordinates.
geoBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        showError('Your browser does not support geolocation.');
        return;
    }

    geoBtn.textContent = 'Loading';
    geoBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        pos => {
            geoBtn.textContent = 'Locate';
            geoBtn.disabled = false;
            fetchWeather(null, { lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        err => {
            geoBtn.textContent = 'Locate';
            geoBtn.disabled = false;
            const msgs = {
                1: 'Location access was denied.',
                2: 'Your location could not be determined.',
                3: 'The location request timed out.'
            };
            showError(msgs[err.code] || 'Could not get your location.');
        }
    );
});

quickButtons.forEach(btn => btn.addEventListener('click', () => {
    const city = btn.getAttribute('data-city');
    cityInput.value = city;
    fetchWeather(city);
}));

historyList.addEventListener('click', e => {
    const btn = e.target.closest('.history-btn');
    if (!btn) return;
    const city = btn.getAttribute('data-city');
    cityInput.value = city;
    fetchWeather(city);
});

// Shares the currently visible weather summary or copies it to the clipboard.
shareBtn.addEventListener('click', async () => {
    const city = document.getElementById('cityName').textContent;
    const temp = document.getElementById('temperature').textContent;
    const desc = document.getElementById('weatherDesc').textContent;
    const feelsLike = document.getElementById('feelsLike').textContent;
    const humidity = document.getElementById('humidity').textContent;
    const wind = document.getElementById('windSpeed').textContent;
    const unit = getTemperatureUnit();

    const text =
        `${city}\n` +
        `${temp}°${unit} - ${desc}\n` +
        `Feels like: ${feelsLike}\n` +
        `Humidity: ${humidity}\n` +
        `Wind: ${wind}`;

    try {
        if (navigator.share) {
            await navigator.share({ title: `Weather in ${city}`, text });
        } else {
            await navigator.clipboard.writeText(text);
            shareBtn.textContent = 'Copied';
            setTimeout(() => { shareBtn.textContent = 'Share'; }, 2200);
        }
    } catch {
        /* user cancelled */
    }
});

window.addEventListener('load', () => {
    renderSearchHistory();
    fetchWeather('Sofia');
});
