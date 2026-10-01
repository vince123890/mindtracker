/** Grafik garis SVG sederhana untuk Progress Curve (server-rendered, tanpa library). */
export function LineChart({
  series,
  labels,
  threshold,
  height = 180,
}: {
  series: { name: string; values: (number | null)[]; color: string }[];
  labels: string[];
  threshold?: number | null;
  height?: number;
}) {
  const width = 560;
  const pad = { l: 36, r: 12, t: 12, b: 28 };
  const iw = width - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const x = (i: number) => pad.l + (labels.length <= 1 ? iw / 2 : (i * iw) / (labels.length - 1));
  const y = (v: number) => pad.t + ih - Math.min(1, Math.max(0, v)) * ih;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Progress curve">
      {[0, 0.25, 0.5, 0.75, 1].map((g) => (
        <g key={g}>
          <line x1={pad.l} x2={width - pad.r} y1={y(g)} y2={y(g)} stroke="#e2e8f0" />
          <text x={4} y={y(g) + 4} fontSize="10" fill="#64748b">{Math.round(g * 100)}%</text>
        </g>
      ))}
      {threshold != null ? <line x1={pad.l} x2={width - pad.r} y1={y(threshold)} y2={y(threshold)} stroke="#e11d48" strokeDasharray="4 3" /> : null}
      {labels.map((l, i) => <text key={l} x={x(i)} y={height - 8} fontSize="10" textAnchor="middle" fill="#64748b">{l}</text>)}
      {series.map((s) => {
        const pts = s.values.map((v, i) => (v === null ? null : `${x(i)},${y(v)}`)).filter(Boolean);
        return (
          <g key={s.name}>
            <polyline points={pts.join(" ")} fill="none" stroke={s.color} strokeWidth="2.5" />
            {s.values.map((v, i) => (v === null ? null : <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill={s.color} />))}
          </g>
        );
      })}
    </svg>
  );
}
