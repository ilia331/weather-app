let tempChart;

// Finds the index for the current hour inside the API hourly array.
export function getCurrentHourIndex(times) {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const target =
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
        `T${pad(now.getHours())}:00`;
    const idx = times.indexOf(target);
    return idx === -1 ? now.getHours() : idx;
}

function cToF(temp) {
    return (temp * 9 / 5) + 32;
}

// Draws the next 24 hours of temperature data in the selected unit.
export function updateChart(hourly, startIdx, unit = 'C') {
    const labels = hourly.time.slice(startIdx, startIdx + 24).map(t => t.slice(11, 16));
    const temps = hourly.temperature_2m
        .slice(startIdx, startIdx + 24)
        .map(temp => Math.round(unit === 'F' ? cToF(temp) : temp));
    const unitLabel = `°${unit}`;

    const ctx = document.getElementById('tempChart').getContext('2d');
    if (tempChart) tempChart.destroy();

    tempChart = new window.Chart(ctx, {
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
                tooltip: { callbacks: { label: c => `${c.raw}${unitLabel}` } }
            },
            scales: {
                x: {
                    ticks: { color: 'rgba(255,255,255,0.7)', maxTicksLimit: 8 },
                    grid: { color: 'rgba(255,255,255,0.08)' }
                },
                y: {
                    ticks: { color: 'rgba(255,255,255,0.7)', callback: v => `${v}${unitLabel}` },
                    grid: { color: 'rgba(255,255,255,0.08)' }
                }
            }
        }
    });
}
