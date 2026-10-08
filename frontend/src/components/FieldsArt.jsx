// Procedurally drawn aerial farmland (no external images needed, works offline).
// Deterministic: the same seed always gives the same picture.
const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const GREENS = ['#2f6b35', '#3f7d3a', '#4c8a43', '#5a9a45', '#6aa84f', '#7aa94b', '#8fb35a', '#a3b86a', '#b9b56a', '#3a7a4b', '#2c5f3a']

export default function FieldsArt({ seed = 7, w = 1200, h = 600, polygon = null, label = null, sub = null, className = '' }) {
  const r = rng(seed)
  const cells = []
  const cols = Math.ceil(w / 70) + 4, rows = Math.ceil(h / 50) + 4
  let y = -120
  for (let j = 0; j < rows; j++) {
    const rh = 38 + r() * 46
    let x = -160
    for (let i = 0; i < cols; i++) {
      const rw = 50 + r() * 90
      cells.push({ x, y, w: rw, h: rh, c: GREENS[Math.floor(r() * GREENS.length)], o: 0.78 + r() * 0.22, stripes: r() > 0.62 })
      x += rw
      if (x > w + 160) break
    }
    y += rh
    if (y > h + 120) break
  }
  const trees = Array.from({ length: 70 }, () => ({ x: r() * w, y: r() * h, s: 2 + r() * 5 }))
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label="Schematic aerial view" width="100%" height="100%">
      <rect width={w} height={h} fill="#2f6b35" />
      <g transform={`rotate(-14 ${w / 2} ${h / 2})`}>
        {cells.map((c, i) => (
          <g key={i}>
            <rect x={c.x} y={c.y} width={c.w} height={c.h} fill={c.c} opacity={c.o} stroke="#1f4d2b" strokeOpacity="0.45" strokeWidth="1.2" />
            {c.stripes && Array.from({ length: Math.floor(c.w / 9) }, (_, k) => <line key={k} x1={c.x + k * 9 + 4} y1={c.y} x2={c.x + k * 9 + 4} y2={c.y + c.h} stroke="#fff" strokeOpacity="0.07" />)}
          </g>))}
        <path d={`M-200 ${h * 0.62} C ${w * 0.3} ${h * 0.5}, ${w * 0.6} ${h * 0.75}, ${w + 200} ${h * 0.58}`} stroke="#d6c9a0" strokeOpacity="0.8" strokeWidth="7" fill="none" />
        <path d={`M${w * 0.35} -200 C ${w * 0.4} ${h * 0.3}, ${w * 0.3} ${h * 0.7}, ${w * 0.38} ${h + 200}`} stroke="#c9bf9a" strokeOpacity="0.7" strokeWidth="5" fill="none" />
      </g>
      {trees.map((t, i) => <circle key={i} cx={t.x} cy={t.y} r={t.s} fill="#1d4a28" opacity="0.55" />)}
      {polygon && (
        <g>
          <polygon points={polygon} fill="#86efac" fillOpacity="0.28" stroke="#bbf7d0" strokeWidth="3" />
          {label && <text x={w / 2} y={h / 2} textAnchor="middle" fill="#fff" fontSize={Math.round(h / 8)} fontWeight="800" style={{ paintOrder: 'stroke' }} stroke="#14532d" strokeWidth="4">{label}</text>}
          {sub && <text x={w / 2} y={h / 2 + h / 9} textAnchor="middle" fill="#ecfdf5" fontSize={Math.round(h / 14)} fontWeight="600" style={{ paintOrder: 'stroke' }} stroke="#14532d" strokeWidth="3">{sub}</text>}
        </g>)}
    </svg>
  )
}
