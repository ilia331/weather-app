// ─────────────────────────────────────────────
// UI — обновяване на DOM елементи
// ─────────────────────────────────────────────

import { startParticles }                from './particles.js';
import { updateCompass }                 from './compass.js';
import { getCurrentHourIndex, updateChart } from './chart.js';

// ── DOM референции ──────────────────────────
const weatherCard    = document.getElementById('weatherCard');
const skeletonCard   = document.getElementById('skeletonCard');
const errorBanner    = document.getElementById('errorBanner');
const cityNameElem   = document.getElementById('cityName');
const tempElem       = document.getElementById('temperature');
const descElem       = document.getElementById('weatherDesc');
const humidityElem   = document.getElementById('humidity');
const windElem       = document.getElementById('windSpeed');
const feelsLikeElem  = document.getElementById('feelsLike');
const goldenTimeElem = document.getElementById('goldenTime');
const blueTimeElem   = document.getElementById('blueTime');

// ── Описания на времето ──────────────────────
const weatherDescriptions = {
    0:  'Ясно небе',     1: 'Предимно ясно',  2: 'Частично облачно', 3: 'Облачно',
    45: 'Мъгла',        48: 'Заскрежена мъгла',
    51: 'Слаба мъгла',  53: 'Умерена ръмежа', 55: 'Гъста ръмежа',
    61: 'Слаб дъжд',    63: 'Умерен дъжд',    65: 'Силен дъжд',
    71: 'Слаб сняг',    73: 'Умерен сняг',    75: 'Силен сняг',
    80: 'Дъждовни душове', 95: 'Гръмотевична буря'
};

// ── Скелетен лоудър ──────────────────────────
export function showSkeleton() { skeletonCard.style.display = 'block'; }
export function hideSkeleton() { skeletonCard.style.display = 'none'; }

// ── Пауза ─────────────────────────────────────
export function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Fade helpers ─────────────────────────────
export function isCardVisible() { return weatherCard.style.display === 'block'; }

export async function cardFadeOut() {
    weatherCard.style.opacity   = '0';
    weatherCard.style.transform = 'translateY(14px) scale(0.98)';
    await sleep(370);
    weatherCard.style.display = 'none';
}

export function cardFadeIn() {
    weatherCard.style.opacity   = '0';
    weatherCard.style.transform = 'translateY(14px) scale(0.98)';
    weatherCard.style.display   = 'block';
    requestAnimationFrame(() => requestAnimationFrame(() => {
        weatherCard.style.opacity   = '1';
        weatherCard.style.transform = 'translateY(0) scale(1)';
    }));
}

export function hideCard() { weatherCard.style.display = 'none'; }

export function restoreCard() {
    weatherCard.style.display   = 'block';
    weatherCard.style.opacity   = '1';
    weatherCard.style.transform = 'translateY(0) scale(1)';
}

// ── Error banner ─────────────────────────────
export function showError(msg) {
    if (!errorBanner) return;
    errorBanner.textContent = msg;
    errorBanner.classList.add('visible');
}

export function clearError() {
    if (!errorBanner) return;
    errorBanner.classList.remove('visible');
}

// ── Динамичен фон ─────────────────────────────
export function updateBackground(code, isNight) {
    const all = ['bg-clear','bg-cloudy','bg-fog','bg-rain','bg-snow','bg-storm','bg-night-clear','bg-night-cloudy'];
    document.body.classList.remove(...all);

    if (isNight) {
        document.body.classList.add(code <= 1 ? 'bg-night-clear' : 'bg-night-cloudy');
        return;
    }
    if (code <= 1)                                                document.body.classList.add('bg-clear');
    else if (code <= 3)                                           document.body.classList.add('bg-cloudy');
    else if (code <= 48)                                          document.body.classList.add('bg-fog');
    else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) document.body.classList.add('bg-rain');
    else if (code >= 71 && code <= 77)                            document.body.classList.add('bg-snow');
    else if (code >= 95)                                          document.body.classList.add('bg-storm');
    else                                                          document.body.classList.add('bg-cloudy');
}

// ── Анимирана икона ───────────────────────────
function buildRays(n = 8) {
    let html = '';
    for (let i = 0; i < n; i++)
        html += `<div class="sun-ray" style="transform:rotate(${i * (360 / n)}deg)"></div>`;
    return html;
}

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
        html = `<div class="wi-cloud"><div class="cloud"></div></div>`;
    } else if (code === 45 || code === 48) {
        html = `<div class="wi-fog">
                    <div class="fog-bar"></div><div class="fog-bar"></div>
                    <div class="fog-bar"></div><div class="fog-bar"></div>
                </div>`;
    } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
        html = `<div class="wi-rain">
                    <div class="cloud"></div>
                    <div class="drops">
                        <span></span><span></span><span></span><span></span><span></span>
                    </div>
                </div>`;
    } else if (code >= 71 && code <= 77) {
        html = `<div class="wi-snow">
                    <div class="cloud"></div>
                    <div class="flakes">
                        <span>❄</span><span>❄</span><span>❄</span><span>❄</span>
                    </div>
                </div>`;
    } else if (code >= 95) {
        html = `<div class="wi-storm">
                    <div class="cloud dark-cloud"></div>
                    <div class="bolt">⚡</div>
                    <div class="drops"><span></span><span></span><span></span></div>
                </div>`;
    } else {
        html = `<div class="wi-cloud"><div class="cloud"></div></div>`;
    }

    wrap.innerHTML = html;
}

// ── Термометър ────────────────────────────────
export function updateThermometer(temp) {
    const pct   = Math.min(100, Math.max(0, ((temp + 20) / 65) * 100));
    const color =
        temp < 0  ? '#00b4d8' :
        temp < 10 ? '#48cae4' :
        temp < 20 ? '#06d6a0' :
        temp < 30 ? '#f77f00' : '#ef233c';

    const fill = document.getElementById('thermoFill');
    const bulb = document.getElementById('thermoBulb');
    fill.style.height          = `${pct}%`;
    fill.style.backgroundColor = color;
    bulb.style.backgroundColor = color;
    bulb.style.boxShadow       = `0 0 10px ${color}99`;
}

// ── „Трябва ли ми?" карти ────────────────────
export function updateShouldI(code, temp, wind, humidity) {
    const isRain  = (code >= 51 && code <= 67) || (code >= 80 && code <= 82);
    const isStorm = code >= 95;
    const isClear = code <= 1;
    const isCold  = temp < 8;
    const isHot   = temp > 30;
    const isWindy = wind > 35;

    const cards = [
        {
            icon: '☂️', q: 'Чадър?',
            ok: !isRain && !isStorm,
            answer: isStorm ? 'Задължително' : isRain ? 'Да' : 'Не',
            note:   isStorm ? 'Предстои буря' : isRain ? 'Очаква се дъжд' : 'Без дъжд'
        },
        {
            icon: '🕶️', q: 'Слънчеви очила?',
            ok: isClear && temp > 12,
            answer: isClear ? 'Да' : 'Не е нужно',
            note:   isClear ? 'Ярко слънце' : 'Не е слънчево'
        },
        {
            icon: '🧥', q: 'Яке?',
            ok: !isCold,
            answer: isCold ? 'Да' : temp < 18 ? 'Може би' : 'Не',
            note:   isCold ? `${temp}°C — облечи се топло` : temp < 18 ? 'Лек слой помага' : `${temp}°C — добре е`
        },
        {
            icon: '🏃', q: 'За бягане?',
            ok: !isRain && !isStorm && !isWindy && temp > 4 && temp < 33,
            answer: (!isRain && !isStorm && !isWindy && temp > 4 && temp < 33) ? 'Върви!' : 'По-добре не',
            note:   isStorm ? 'Опасно' : isRain ? 'Твърде мокро' : isWindy ? 'Твърде ветровито' : isCold ? 'Твърде студено' : isHot ? 'Твърде горещо' : 'Идеални условия!'
        },
        {
            icon: '📸', q: 'Добро за снимки?',
            ok: isClear || code === 2,
            answer: isClear ? 'Перфектно!' : code === 2 ? 'Доста добро' : 'Не е идеално',
            note:   isClear ? 'Златен час ще грее' : code === 2 ? 'Мека дифузна светлина' : 'Плоска светлина днес'
        },
        {
            icon: '🪟', q: 'Отвори прозорец?',
            ok: !isRain && !isStorm && temp >= 16 && temp <= 27 && !isWindy,
            answer: (!isRain && !isStorm && temp >= 16 && temp <= 27 && !isWindy) ? 'Да!' : 'Не',
            note:   isRain || isStorm ? 'Ще влезе дъжд' : isWindy ? 'Твърде ветровито' : isCold ? 'Твърде студено' : isHot ? 'По-добре климатик' : 'Свеж въздух!'
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

// ── Главна функция за обновяване на UI ────────
export function updateUI(location, data) {
    const current   = data.current_weather;
    const hourIdx   = getCurrentHourIndex(data.hourly.time);
    const code      = current.weathercode;
    const temp      = Math.round(current.temperature);
    const feelsLike = Math.round(data.hourly.apparent_temperature[hourIdx]);

    cityNameElem.textContent  = location;
    tempElem.textContent      = temp;
    descElem.textContent      = weatherDescriptions[code] || 'Облачно';
    windElem.textContent      = `${current.windspeed} km/h`;
    humidityElem.textContent  = `${data.hourly.relativehumidity_2m[hourIdx]}%`;
    feelsLikeElem.textContent = `${feelsLike}°C`;

    // Фотографски часове
    const sunset = new Date(data.daily.sunset[0]);
    const sunrise= new Date(data.daily.sunrise[0]);
    const fmt    = d => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    goldenTimeElem.textContent = `${fmt(new Date(sunset - 3_600_000))} – ${fmt(sunset)}`;
    blueTimeElem.textContent   = `${fmt(sunset)} – ${fmt(new Date(sunset.getTime() + 1_800_000))}`;

    // Фон
    const isNight = new Date() < sunrise || new Date() > sunset;
    updateBackground(code, isNight);

    // Анимирана икона
    setWeatherIcon(code);

    // Частици
    let pMode = 'none';
    if      (code <= 1)                                              pMode = 'clear';
    else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) pMode = 'rain';
    else if (code >= 71 && code <= 77)                               pMode = 'snow';
    else if (code >= 95)                                             pMode = 'storm';
    startParticles(pMode);

    // Термометър
    updateThermometer(temp);

    // Компас
    updateCompass(current.winddirection);

    // Трябва ли ми?
    updateShouldI(code, temp, current.windspeed, data.hourly.relativehumidity_2m[hourIdx]);

    // Диаграма
    updateChart(data.hourly, hourIdx);
}
