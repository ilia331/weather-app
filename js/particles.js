// ─────────────────────────────────────────────
// PARTICLE SYSTEM — дъжд, сняг, искри, буря
// ─────────────────────────────────────────────

const canvas = document.getElementById('particleCanvas');
const pctx   = canvas.getContext('2d');
let particles    = [];
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
            pctx.lineWidth   = p.width;
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

/**
 * Стартира система от частици.
 * @param {'rain'|'storm'|'snow'|'clear'|'none'} mode
 */
export function startParticles(mode) {
    particleMode = mode;
    cancelAnimationFrame(animId);
    particles = [];
    pctx.clearRect(0, 0, canvas.width, canvas.height);
    if (mode === 'none') return;

    const counts = { rain: 130, storm: 220, snow: 70, clear: 55 };
    for (let i = 0; i < (counts[mode] || 0); i++) particles.push(makeParticle(mode));
    drawParticles();
}
