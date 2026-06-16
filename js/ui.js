import { startParticles } from './particles.js';
import { updateCompass } from './compass.js';
import { getCurrentHourIndex, updateChart } from './chart.js';

const weatherCard = document.getElementById('weatherCard');
const skeletonCard = document.getElementById('skeletonCard');
const errorBanner = document.getElementById('errorBanner');
const cityNameElem = document.getElementById('cityName');
const tempElem = document.getElementById('temperature');
const tempUnitElem = document.getElementById('tempUnit');
const descElem = document.getElementById('weatherDesc');
const humidityElem = document.getElementById('humidity');
const windElem = document.getElementById('windSpeed');
const feelsLikeElem = document.getElementById('feelsLike');
const goldenTimeElem = document.getElementById('goldenTime');
const blueTimeElem = document.getElementById('blueTime');

let temperatureUnit = 'C';
let lastLocation = null;
let lastWeatherData = null;

const weatherDescriptions = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    80: 'Rain showers',
    81: 'Rain showers',
    82: 'Heavy rain showers',
    95: 'Thunderstorm'
};

function cToF(temp) {
    return (temp * 9 / 5) + 32;
}

// Converts Celsius API values to the currently selected display unit.
function displayTemp(tempC) {
    const value = temperatureUnit === 'F' ? cToF(tempC) : tempC;
    return Math.round(value);
}

function unitLabel() {
    return `°${temperatureUnit}`;
}

export function getTemperatureUnit() {
    return temperatureUnit;
}

// Updates the unit and redraws the latest weather data without another API call.
export function setTemperatureUnit(unit) {
    temperatureUnit = unit === 'F' ? 'F' : 'C';
    if (lastLocation && lastWeatherData) {
        renderWeather(lastLocation, lastWeatherData);
    }
}

// Shows the loading skeleton while weather data is being fetched.
export function showSkeleton() {
    skeletonCard.style.display = 'block';
}

// Hides the loading skeleton after the request finishes.
export function hideSkeleton() {
    skeletonCard.style.display = 'none';
}

// Small async pause used by the card fade transition.
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function isCardVisible() {
    return weatherCard.style.display === 'block';
}

// Fades the current card out before showing a new forecast.
export async function cardFadeOut() {
    weatherCard.style.opacity = '0';
    weatherCard.style.transform = 'translateY(14px) scale(0.98)';
    await sleep(370);
    weatherCard.style.display = 'none';
}

// Fades the weather card in after new data is rendered.
export function cardFadeIn() {
    weatherCard.style.opacity = '0';
    weatherCard.style.transform = 'translateY(14px) scale(0.98)';
    weatherCard.style.display = 'block';
    requestAnimationFrame(() => requestAnimationFrame(() => {
        weatherCard.style.opacity = '1';
        weatherCard.style.transform = 'translateY(0) scale(1)';
    }));
}

export function hideCard() {
    weatherCard.style.display = 'none';
}

export function restoreCard() {
    weatherCard.style.display = 'block';
    weatherCard.style.opacity = '1';
    weatherCard.style.transform = 'translateY(0) scale(1)';
}

// Displays an inline error banner above the search controls.
export function showError(msg) {
    if (!errorBanner) return;
    errorBanner.textContent = msg;
    errorBanner.classList.add('visible');
}

export function clearError() {
    if (!errorBanner) return;
    errorBanner.classList.remove('visible');
}

// Applies a background theme based on weather code and daylight.
export function updateBackground(code, isNight) {
    const all = ['bg-clear', 'bg-cloudy', 'bg-fog', 'bg-rain', 'bg-snow', 'bg-storm', 'bg-night-clear', 'bg-night-cloudy'];
    document.body.classList.remove(...all);

    if (isNight) {
        document.body.classList.add(code <= 1 ? 'bg-night-clear' : 'bg-night-cloudy');
        return;
    }

    if (code <= 1) document.body.classList.add('bg-clear');
    else if (code <= 3) document.body.classList.add('bg-cloudy');
    else if (code <= 48) document.body.classList.add('bg-fog');
    else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) document.body.classList.add('bg-rain');
    else if (code >= 71 && code <= 77) document.body.classList.add('bg-snow');
    else if (code >= 95) document.body.classList.add('bg-storm');
    else document.body.classList.add('bg-cloudy');
}

function buildRays(n = 8) {
    let html = '';
    for (let i = 0; i < n; i++) {
        html += `<div class="sun-ray" style="transform:rotate(${i * (360 / n)}deg)"></div>`;
    }
    return html;
}

// Builds the animated weather icon shown above the temperature.
export function setWeatherIcon(code) {
    const wrap = document.getElementById('weatherIconWrap');
    let html = '';

    if (code <= 1) {
        html = `<div class="wi-sun">
            <div class="sun-rays-wrap">${buildRays()}</div>
            <div class="sun-core"></div>
        </div>`;
    } else if (code === 2) {
        html = `<div class="wi-partly">
            <div class="pc-sun-wrap">
                <div class="sun-rays-wrap">${buildRays(6)}</div>
                <div class="sun-core"></div>
            </div>
            <div class="cloud pc-cloud"></div>
        </div>`;
    } else if (code === 3) {
        html = '<div class="wi-cloud"><div class="cloud"></div></div>';
    } else if (code === 45 || code === 48) {
        html = `<div class="wi-fog">
            <div class="fog-bar"></div><div class="fog-bar"></div>
            <div class="fog-bar"></div><div class="fog-bar"></div>
        </div>`;
    } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
        html = `<div class="wi-rain">
            <div class="cloud"></div>
            <div class="drops"><span></span><span></span><span></span><span></span><span></span></div>
        </div>`;
    } else if (code >= 71 && code <= 77) {
        html = `<div class="wi-snow">
            <div class="cloud"></div>
            <div class="flakes"><span>*</span><span>*</span><span>*</span><span>*</span></div>
        </div>`;
    } else if (code >= 95) {
        html = `<div class="wi-storm">
            <div class="cloud dark-cloud"></div>
            <div class="bolt">!</div>
            <div class="drops"><span></span><span></span><span></span></div>
        </div>`;
    } else {
        html = '<div class="wi-cloud"><div class="cloud"></div></div>';
    }

    wrap.innerHTML = html;
}

// Updates the thermometer height and color from the Celsius temperature.
export function updateThermometer(tempC) {
    const pct = Math.min(100, Math.max(0, ((tempC + 20) / 65) * 100));
    const color =
        tempC < 0 ? '#00b4d8' :
        tempC < 10 ? '#48cae4' :
        tempC < 20 ? '#06d6a0' :
        tempC < 30 ? '#f77f00' : '#ef233c';

    const fill = document.getElementById('thermoFill');
    const bulb = document.getElementById('thermoBulb');
    fill.style.height = `${pct}%`;
    fill.style.backgroundColor = color;
    bulb.style.backgroundColor = color;
    bulb.style.boxShadow = `0 0 10px ${color}99`;
}

// Builds the quick lifestyle recommendations for the current conditions.
export function updateShouldI(code, tempC, wind) {
    const isRain = (code >= 51 && code <= 67) || (code >= 80 && code <= 82);
    const isStorm = code >= 95;
    const isClear = code <= 1;
    const isCold = tempC < 8;
    const isHot = tempC > 30;
    const isWindy = wind > 35;
    const tempText = `${displayTemp(tempC)}${unitLabel()}`;

    const cards = [
        {
            icon: '☂️',
            q: 'Bring umbrella?',
            ok: !isRain && !isStorm,
            answer: isStorm ? 'Definitely' : isRain ? 'Yes' : 'No',
            note: isStorm ? 'Storm incoming' : isRain ? 'Rain expected' : 'No rain forecast'
        },
        {
            icon: '🕶️',
            q: 'Wear sunglasses?',
            ok: isClear && tempC > 12,
            answer: isClear ? 'Yes' : 'No need',
            note: isClear ? 'Bright sunshine' : 'Not very sunny today'
        },
        {
            icon: '🧥',
            q: 'Wear a jacket?',
            ok: !isCold,
            answer: isCold ? 'Yes' : tempC < 18 ? 'Maybe' : 'No',
            note: isCold ? `${tempText} - bundle up` : tempC < 18 ? 'A light layer helps' : `${tempText} - comfortable`
        },
        {
            icon: '🏃',
            q: 'Go for a run?',
            ok: !isRain && !isStorm && !isWindy && tempC > 4 && tempC < 33,
            answer: (!isRain && !isStorm && !isWindy && tempC > 4 && tempC < 33) ? 'Go for it' : 'Skip it',
            note: isStorm ? 'Too dangerous' : isRain ? 'Too wet' : isWindy ? 'Too windy' : isCold ? 'Too cold' : isHot ? 'Too hot' : 'Great conditions'
        },
        {
            icon: '📸',
            q: 'Good for photos?',
            ok: isClear || code === 2,
            answer: isClear ? 'Perfect' : code === 2 ? 'Pretty good' : 'Not ideal',
            note: isClear ? 'Golden hour will shine' : code === 2 ? 'Soft diffused light' : 'Flat lighting today'
        },
        {
            icon: '🪟',
            q: 'Open windows?',
            ok: !isRain && !isStorm && tempC >= 16 && tempC <= 27 && !isWindy,
            answer: (!isRain && !isStorm && tempC >= 16 && tempC <= 27 && !isWindy) ? 'Yes' : 'No',
            note: isRain || isStorm ? 'Rain may get in' : isWindy ? 'Too windy' : isCold ? 'Too cold' : isHot ? 'Use AC instead' : 'Fresh air is nice'
        }
    ];

    document.getElementById('shouldICards').innerHTML = cards.map(c => `
        <div class="should-card ${c.ok ? 'yes' : 'no'}">
            <div class="should-icon">${c.icon}</div>
            <div class="should-q">${c.q}</div>
            <div class="should-answer">${c.answer}</div>
            <div class="should-note">${c.note}</div>
        </div>
    `).join('');
}

// Writes all weather data into the DOM for the current unit.
function renderWeather(location, data) {
    const current = data.current_weather;
    const hourIdx = getCurrentHourIndex(data.hourly.time);
    const code = current.weathercode;
    const tempC = current.temperature;
    const feelsLikeC = data.hourly.apparent_temperature[hourIdx];

    cityNameElem.textContent = location;
    tempElem.textContent = displayTemp(tempC);
    tempUnitElem.textContent = unitLabel();
    descElem.textContent = weatherDescriptions[code] || 'Cloudy';
    windElem.textContent = `${current.windspeed} km/h`;
    humidityElem.textContent = `${data.hourly.relativehumidity_2m[hourIdx]}%`;
    feelsLikeElem.textContent = `${displayTemp(feelsLikeC)}${unitLabel()}`;

    const sunset = new Date(data.daily.sunset[0]);
    const sunrise = new Date(data.daily.sunrise[0]);
    const fmt = d => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    goldenTimeElem.textContent = `${fmt(new Date(sunset - 3_600_000))} - ${fmt(sunset)}`;
    blueTimeElem.textContent = `${fmt(sunset)} - ${fmt(new Date(sunset.getTime() + 1_800_000))}`;

    const isNight = new Date() < sunrise || new Date() > sunset;
    updateBackground(code, isNight);
    setWeatherIcon(code);

    let pMode = 'none';
    if (code <= 1) pMode = 'clear';
    else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) pMode = 'rain';
    else if (code >= 71 && code <= 77) pMode = 'snow';
    else if (code >= 95) pMode = 'storm';
    startParticles(pMode);

    updateThermometer(tempC);
    updateCompass(current.winddirection);
    updateShouldI(code, tempC, current.windspeed);
    updateChart(data.hourly, hourIdx, temperatureUnit);
}

// Stores the latest weather payload so unit switches can redraw it.
export function updateUI(location, data) {
    lastLocation = location;
    lastWeatherData = data;
    renderWeather(location, data);
}
