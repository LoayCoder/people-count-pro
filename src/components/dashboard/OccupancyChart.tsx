import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartData {
  hour: string;
  in: number;
  out: number;
  occupancy: number;
}

interface OccupancyChartProps {
  data?: ChartData[];
}

const defaultData = [
  { hour: "00:00", occupancy: 0, in: 0, out: 0 },
  { hour: "02:00", occupancy: 0, in: 0, out: 0 },
  { hour: "04:00", occupancy: 0, in: 0, out: 0 },
  { hour: "06:00", occupancy: 0, in: 0, out: 0 },
  { hour: "08:00", occupancy: 0, in: 0, out: 0 },
  { hour: "10:00", occupancy: 0, in: 0, out: 0 },
  { hour: "12:00", occupancy: 0, in: 0, out: 0 },
  { hour: "14:00", occupancy: 0, in: 0, out: 0 },
  { hour: "16:00", occupancy: 0, in: 0, out: 0 },
  { hour: "18:00", occupancy: 0, in: 0, out: 0 },
  { hour: "20:00", occupancy: 0, in: 0, out: 0 },
  { hour: "22:00", occupancy: 0, in: 0, out: 0 },
];

export function OccupancyChart({ data }: OccupancyChartProps) {
  const chartData = data && data.length > 0 ? data : defaultData;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
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
            dataKey="hour"
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
