import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const mockData = [
  { time: "00:00", occupancy: 12, in: 15, out: 8 },
  { time: "02:00", occupancy: 8, in: 5, out: 9 },
  { time: "04:00", occupancy: 5, in: 3, out: 6 },
  { time: "06:00", occupancy: 15, in: 18, out: 8 },
  { time: "08:00", occupancy: 45, in: 52, out: 22 },
  { time: "10:00", occupancy: 78, in: 65, out: 32 },
  { time: "12:00", occupancy: 95, in: 48, out: 31 },
  { time: "14:00", occupancy: 82, in: 35, out: 48 },
  { time: "16:00", occupancy: 68, in: 42, out: 56 },
  { time: "18:00", occupancy: 45, in: 28, out: 51 },
  { time: "20:00", occupancy: 32, in: 18, out: 31 },
  { time: "22:00", occupancy: 18, in: 8, out: 22 },
];

export function OccupancyChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={mockData}>
          <defs>
            <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(217 33% 18%)"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(222 47% 10%)",
              border: "1px solid hsl(217 33% 18%)",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
            labelStyle={{ color: "hsl(210 40% 96%)" }}
          />
          <Area
            type="monotone"
            dataKey="occupancy"
            stroke="hsl(217 91% 60%)"
            strokeWidth={2}
            fill="url(#occupancyGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
