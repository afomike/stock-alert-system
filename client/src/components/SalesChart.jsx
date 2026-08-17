import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ink text-paper px-3 py-2 font-mono text-xs">
      <p className="text-paper/60 mb-1">{label}</p>
      <p>{payload[0].value} units moved</p>
    </div>
  );
}

/**
 * data: [{ date: 'Mon', units: 24 }, ...]
 */
export default function SalesChart({ data, title = 'Stock Movement Trend' }) {
  return (
    <div className="border border-line bg-white p-5">
      <p className="font-mono text-[0.68rem] uppercase tracking-widest text-ink/50 mb-4">
        {title}
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4A5B7A" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#4A5B7A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#D8D4CB" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontFamily: 'IBM Plex Mono', fontSize: 11, fill: '#14181F99' }}
            axisLine={{ stroke: '#D8D4CB' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontFamily: 'IBM Plex Mono', fontSize: 11, fill: '#14181F99' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="units"
            stroke="#4A5B7A"
            strokeWidth={2}
            fill="url(#salesFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
