const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const geoBtn = document.getElementById('geoBtn');
const weatherCard = document.getElementById('weatherCard');

const cityNameElem   = document.getElementById('cityName');
const tempElem       = document.getElementById('temperature');
const descElem       = document.getElementById('weatherDesc');
const humidityElem   = document.getElementById('humidity');
const windElem       = document.getElementById('windSpeed');
const feelsLikeElem  = document.getElementById('feelsLike');
const goldenTimeElem = document.getElementById('goldenTime');
const blueTimeElem   = document.getElementById('blueTime');

const quickButtons = document.querySelectorAll('.quick-btn');

let map, tempChart;

// ─────────────────────────────────────────────
// PARTICLE SYSTEM
// ─────────────────────────────────────────────
const canvas = document.getElementById('particleCanvas');
const pctx   = canvas.getContext('2d');
let particles = [];
let particleMode = '';
let animId;

function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function makeParticle(mode) {
    const w = canvas.width, h = canvas.height;
    if (mode === 'rain' || mode === 'storm') {
        return {
            x: Math.random() * w,
            y: Math.random() * h * 1.5 - h * 0.5,
            len: Math.random() * 18 + 8,
            speed: Math.random() * 10 + 10,
            opacity: Math.random() * 0.35 + 0.15,
            width: Math.random() + 0.4
        };
    }
    if (mode === 'snow') {
        return {
            x: Math.random() * w,
            y: Math.random() * h * 1.5 - h * 0.5,
            r: Math.random() * 3.5 + 1,
            speed: Math.random() * 1.2 + 0.4,
            drift: (Math.random() - 0.5) * 0.8,
            wobble: Math.random() * Math.PI * 2,
            opacity: Math.random() * 0.5 + 0.25
        };
    }
    if (mode === 'clear') {
        return {
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 1.4 + 0.3,
            opacity: 0,
            max: Math.random() * 0.3 + 0.05,
            dir: 1,
            speed: Math.random() * 0.007 + 0.003
        };
    }
}

function startParticles(mode) {
    particleMode = mode;
    cancelAnimationFrame(animId);
    particles = [];
    pctx.clearRect(0, 0, canvas.width, canvas.height);
    if (mode === 'none') return;

    const counts = { rain: 130, storm: 220, snow: 70, clear: 55 };
    for (let i = 0; i < (counts[mode] || 0); i++) particles.push(makeParticle(mode));
    drawParticles();
}

function drawParticles() {
    pctx.clearRect(0, 0, canvas.width, canvas.height);

    if (particleMode === 'storm' && Math.random() < 0.003) {
        pctx.fillStyle = 'rgba(255,255,220,0.06)';
        pctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    for (const p of particles) {
        if (particleMode === 'rain' || particleMode === 'storm') {
            pctx.beginPath();
            pctx.moveTo(p.x, p.y);
            pctx.lineTo(p.x + p.len * 0.22, p.y + p.len);
            pctx.strokeStyle = `rgba(180,215,245,${p.opacity})`;
            pctx.lineWidth = p.width;
            pctx.stroke();
            p.y += p.speed; p.x += p.speed * 0.18;
            if (p.y - p.len > canvas.height) { p.y = -p.len; p.x = Math.random() * canvas.width; }

        } else if (particleMode === 'snow') {
            pctx.beginPath();
            pctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            pctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
            pctx.fill();
            p.y += p.speed; p.wobble += 0.025;
            p.x += Math.sin(p.wobble) * p.drift;
            if (p.y - p.r > canvas.height) { p.y = -p.r; p.x = Math.random() * canvas.width; }

        } else if (particleMode === 'clear') {
            pctx.beginPath();
            pctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            pctx.fillStyle = `rgba(255,255,200,${p.opacity})`;
            pctx.fill();
            p.opacity += p.speed * p.dir;
            if (p.opacity > p.max) p.dir = -1;
            if (p.opacity < 0) { p.dir = 1; p.x = Math.random() * canvas.width; p.y = Math.random() * canvas.height; }
        }
    }
    animId = requestAnimationFrame(drawParticles);
}

// ─────────────────────────────────────────────
// ANIMATED WEATHER ICON
// ─────────────────────────────────────────────
function buildRays(n = 8) {
    let html = '';
    for (let i = 0; i < n; i++)
        html += `<div class="sun-ray" style="transform:rotate(${i * (360 / n)}deg)"></div>`;
    return html;
}

function setWeatherIcon(code) {
    const wrap = document.getElementById('weatherIconWrap');
    let html = '';

    if (code <= 1) {
        html = `<div class="wi-sun">
                    <div class="sun-rays-wrap">${buildRays()}</div>
                    <div class="sun-core"></div>
                </div>`;
    } else if (code === 2) {
        html = `<div class="wi-partly">
                    <div class="pc-sun-wrap"><div class="sun-rays-wrap">${buildRays(6)}</div><div class="sun-core"></div></div>
                    <div class="cloud pc-cloud"></div>
                </div>`;
    } else if (code === 3) {
        html = `<div class="wi-cloud"><div class="cloud"></div></div>`;
    } else if (code === 45 || code === 48) {
        html = `<div class="wi-fog"><div class="fog-bar"></div><div class="fog-bar"></div><div class="fog-bar"></div><div class="fog-bar"></div></div>`;
    } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
        html = `<div class="wi-rain">
                    <div class="cloud"></div>
                    <div class="drops"><span></span><span></span><span></span><span></span><span></span></div>
                </div>`;
    } else if (code >= 71 && code <= 77) {
        html = `<div class="wi-snow">
                    <div class="cloud"></div>
                    <div class="flakes"><span>❄</span><span>❄</span><span>❄</span><span>❄</span></div>
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

// ─────────────────────────────────────────────
// SHOULD I? CARDS
// ─────────────────────────────────────────────
function updateShouldI(code, temp, wind, humidity) {
    const isRain  = (code >= 51 && code <= 67) || (code >= 80 && code <= 82);
    const isStorm = code >= 95;
    const isClear = code <= 1;
    const isCold  = temp < 8;
    const isHot   = temp > 30;
    const isWindy = wind > 35;

    const cards = [
        {
            icon: '☂️', q: 'Bring umbrella?',
            ok: !isRain && !isStorm,
            answer: isStorm ? 'Definitely' : isRain ? 'Yes' : 'No',
            note: isStorm ? 'Storm incoming' : isRain ? 'Rain expected' : 'No rain forecast'
        },
        {
            icon: '🕶️', q: 'Wear sunglasses?',
            ok: isClear && temp > 12,
            answer: isClear ? 'Yes' : 'No need',
            note: isClear ? 'Bright sunshine' : 'Not very sunny today'
        },
        {
            icon: '🧥', q: 'Wear a jacket?',
            ok: !isCold,
            answer: isCold ? 'Yes' : temp < 18 ? 'Maybe' : 'No',
            note: isCold ? `${temp}°C — bundle up` : temp < 18 ? 'Light layer helps' : `${temp}°C — you're fine`
        },
        {
            icon: '🏃', q: 'Go for a run?',
            ok: !isRain && !isStorm && !isWindy && temp > 4 && temp < 33,
            answer: (!isRain && !isStorm && !isWindy && temp > 4 && temp < 33) ? 'Go for it!' : 'Skip it',
            note: isStorm ? 'Too dangerous' : isRain ? 'Too wet' : isWindy ? 'Too windy' : isCold ? 'Too cold' : isHot ? 'Too hot' : 'Perfect conditions!'
        },
        {
            icon: '📸', q: 'Good for photos?',
            ok: isClear || code === 2,
            answer: isClear ? 'Perfect!' : code === 2 ? 'Pretty good' : 'Not ideal',
            note: isClear ? 'Golden hour will shine' : code === 2 ? 'Soft diffused light' : 'Flat lighting today'
        },
        {
            icon: '🪟', q: 'Open windows?',
            ok: !isRain && !isStorm && temp >= 16 && temp <= 27 && !isWindy,
            answer: (!isRain && !isStorm && temp >= 16 && temp <= 27 && !isWindy) ? 'Yes!' : 'No',
            note: isRain || isStorm ? 'Rain will get in' : isWindy ? 'Too windy' : isCold ? 'Too cold' : isHot ? 'Use AC instead' : 'Fresh air is nice'
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

// ─────────────────────────────────────────────
// WEATHER DESCRIPTIONS
// ─────────────────────────────────────────────
const weatherDescriptions = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    80: "Rain showers", 95: "Thunderstorm"
};

// ─────────────────────────────────────────────
// DYNAMIC BACKGROUND
// ─────────────────────────────────────────────
function updateBackground(code, isNight) {
    const all = ['bg-clear','bg-cloudy','bg-fog','bg-rain','bg-snow','bg-storm','bg-night-clear','bg-night-cloudy'];
    document.body.classList.remove(...all);

    if (isNight) {
        document.body.classList.add(code <= 1 ? 'bg-night-clear' : 'bg-night-cloudy');
        return;
    }
    if (code <= 1)                                      document.body.classList.add('bg-clear');
    else if (code <= 3)                                 document.body.classList.add('bg-cloudy');
    else if (code <= 48)                                document.body.classList.add('bg-fog');
    else if ((code >= 51 && code <= 67) || code <= 82)  document.body.classList.add('bg-rain');
    else if (code <= 77)                                document.body.classList.add('bg-snow');
    else if (code >= 95)                                document.body.classList.add('bg-storm');
    else                                                document.body.classList.add('bg-cloudy');
}

// ─────────────────────────────────────────────
// CURRENT HOUR INDEX
// ─────────────────────────────────────────────
function getCurrentHourIndex(times) {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const target = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:00`;
    const idx = times.indexOf(target);
    return idx === -1 ? now.getHours() : idx;
}

// ─────────────────────────────────────────────
// FETCH WEATHER
// ─────────────────────────────────────────────
async function fetchWeather(cityOverride, coords) {
    const city = cityOverride || cityInput.value.trim();
    if (!city && !coords) return;

    searchBtn.textContent = '⏳';
    searchBtn.disabled = true;

    try {
        let latitude, longitude, displayName;

        if (coords) {
            latitude = coords.lat; longitude = coords.lon;
            const rev = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const rd  = await rev.json();
            const a   = rd.address;
            displayName = `${a.city || a.town || a.village || 'Your Location'}, ${a.country_code?.toUpperCase() || ''}`;
        } else {
            const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
            const gd  = await geo.json();
            if (!gd.results) throw new Error('City not found');
            displayName = `${gd.results[0].name}, ${gd.results[0].country}`;
            latitude = gd.results[0].latitude; longitude = gd.results[0].longitude;
        }

        const wr = await fetch(
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${latitude}&longitude=${longitude}` +
            `&current_weather=true` +
            `&daily=sunrise,sunset` +
            `&hourly=relativehumidity_2m,temperature_2m,apparent_temperature` +
            `&timezone=auto`
        );
        const wd = await wr.json();
        updateUI(displayName, wd);
        initRadar(latitude, longitude);

    } catch (err) {
        alert(err.message);
    } finally {
        searchBtn.textContent = '🔍';
        searchBtn.disabled = false;
    }
}

// ─────────────────────────────────────────────
// UPDATE UI
// ─────────────────────────────────────────────
function updateUI(location, data) {
    const current = data.current_weather;
    const hourIdx = getCurrentHourIndex(data.hourly.time);
    const code    = current.weathercode;
    const temp    = Math.round(current.temperature);
    const feelsLike = Math.round(data.hourly.apparent_temperature[hourIdx]);

    cityNameElem.textContent  = location;
    tempElem.textContent      = temp;
    descElem.textContent      = weatherDescriptions[code] || 'Cloudy';
    windElem.textContent      = `${current.windspeed} km/h`;
    humidityElem.textContent  = `${data.hourly.relativehumidity_2m[hourIdx]}%`;
    feelsLikeElem.textContent = `${feelsLike}°C`;

    // Photography times
    const sunset    = new Date(data.daily.sunset[0]);
    const sunrise   = new Date(data.daily.sunrise[0]);
    const fmt = d => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    goldenTimeElem.textContent = `${fmt(new Date(sunset - 3600000))} – ${fmt(sunset)}`;
    blueTimeElem.textContent   = `${fmt(sunset)} – ${fmt(new Date(sunset.getTime() + 1800000))}`;

    // Dynamic background
    const isNight = new Date() < sunrise || new Date() > sunset;
    updateBackground(code, isNight);

    // Animated icon
    setWeatherIcon(code);

    // Particles
    let pMode = 'none';
    if (code <= 1)                                          pMode = 'clear';
    else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) pMode = 'rain';
    else if (code >= 71 && code <= 77)                      pMode = 'snow';
    else if (code >= 95)                                    pMode = 'storm';
    startParticles(pMode);

    // Compass
    updateCompass(current.winddirection);

    // Should I
    updateShouldI(code, temp, current.windspeed, data.hourly.relativehumidity_2m[hourIdx]);

    // Chart
    updateChart(data.hourly, hourIdx);

    weatherCard.style.display = 'block';
}

// ─────────────────────────────────────────────
// HOURLY CHART
// ─────────────────────────────────────────────
function updateChart(hourly, startIdx) {
    const labels = hourly.time.slice(startIdx, startIdx + 24).map(t => t.slice(11, 16));
    const temps  = hourly.temperature_2m.slice(startIdx, startIdx + 24);

    const ctx = document.getElementById('tempChart').getContext('2d');
    if (tempChart) tempChart.destroy();

    tempChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data: temps,
                borderColor: 'rgba(255,255,255,0.9)',
                backgroundColor: 'rgba(255,255,255,0.12)',
                pointBackgroundColor: 'white',
                pointRadius: 3,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: c => `${c.raw}°C` } }
            },
            scales: {
                x: { ticks: { color: 'rgba(255,255,255,0.7)', maxTicksLimit: 8 }, grid: { color: 'rgba(255,255,255,0.08)' } },
                y: { ticks: { color: 'rgba(255,255,255,0.7)', callback: v => `${v}°C` }, grid: { color: 'rgba(255,255,255,0.08)' } }
            }
        }
    });
}

// ─────────────────────────────────────────────
// RADAR MAP
// ─────────────────────────────────────────────
function initRadar(lat, lon) {
    if (map) map.remove();
    map = L.map('radarMap').setView([lat, lon], 7);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    L.tileLayer('https://tilecache.rainviewer.com/v2/radar/nowcast_0/256/{z}/{x}/{y}/2/1_1.png', {
        tileSize: 256, opacity: 0.6
    }).addTo(map);
}

// ─────────────────────────────────────────────
// EVENT LISTENERS
// ─────────────────────────────────────────────
geoBtn.addEventListener('click', () => {
    if (!navigator.geolocation) { alert('Geolocation not supported.'); return; }
    geoBtn.textContent = '⏳'; geoBtn.disabled = true;
    navigator.geolocation.getCurrentPosition(
        pos => { geoBtn.textContent = '📍'; geoBtn.disabled = false; fetchWeather(null, { lat: pos.coords.latitude, lon: pos.coords.longitude }); },
        err => { geoBtn.textContent = '📍'; geoBtn.disabled = false; alert('Could not get location: ' + err.message); }
    );
});

searchBtn.addEventListener('click', () => fetchWeather());
cityInput.addEventListener('keypress', e => { if (e.key === 'Enter') fetchWeather(); });

quickButtons.forEach(btn => btn.addEventListener('click', () => {
    const city = btn.getAttribute('data-city');
    cityInput.value = city;
    fetchWeather(city);
}));

// ─────────────────────────────────────────────
// CITY AUTOCOMPLETE
// ─────────────────────────────────────────────
const autocompleteList = document.getElementById('autocompleteList');
let acTimeout;

cityInput.addEventListener('input', () => {
    const q = cityInput.value.trim();
    clearTimeout(acTimeout);
    if (q.length < 2) { hideAC(); return; }
    acTimeout = setTimeout(() => fetchAC(q), 300);
});

async function fetchAC(query) {
    try {
        const res  = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6`);
        const data = await res.json();
        if (!data.results?.length) { hideAC(); return; }
        showAC(data.results);
    } catch { hideAC(); }
}

function showAC(results) {
    autocompleteList.innerHTML = results.map(r => `
        <li class="ac-item" data-name="${r.name}">
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

function hideAC() { autocompleteList.style.display = 'none'; }
cityInput.addEventListener('blur', () => setTimeout(hideAC, 150));
document.addEventListener('click', e => { if (!e.target.closest('.search-section')) hideAC(); });

// ─────────────────────────────────────────────
// WIND COMPASS
// ─────────────────────────────────────────────
function getCardinal(deg) {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
}

function updateCompass(deg) {
    document.getElementById('compassNeedle').style.transform = `translate(-50%, -50%) rotate(${deg}deg)`;
    document.getElementById('windDirCard').textContent = getCardinal(deg);
    document.getElementById('windDirDeg').textContent  = `${deg}°`;
}

// ─────────────────────────────────────────────
// SHARE BUTTON
// ─────────────────────────────────────────────
document.getElementById('shareBtn').addEventListener('click', async () => {
    const btn  = document.getElementById('shareBtn');
    const city = document.getElementById('cityName').textContent;
    const text =
        `📍 ${city}\n` +
        `🌡 ${tempElem.textContent}°C · ${descElem.textContent}\n` +
        `✨ Feels like ${feelsLikeElem.textContent}\n` +
        `💧 Humidity: ${humidityElem.textContent}\n` +
        `💨 Wind: ${windElem.textContent}`;

    try {
        if (navigator.share) {
            await navigator.share({ title: `Weather in ${city}`, text });
        } else {
            await navigator.clipboard.writeText(text);
            btn.textContent = '✅';
            setTimeout(() => { btn.textContent = '🔗'; }, 2200);
        }
    } catch { /* user cancelled */ }
});

window.onload = () => fetchWeather('Sofia');
