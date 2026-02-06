import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

interface ChartData {
  hour: string;
  in: number;
  out: number;
  occupancy: number;
}

interface InOutChartProps {
  data?: ChartData[];
}

const defaultData = [
  { hour: "06:00", in: 0, out: 0, occupancy: 0 },
  { hour: "08:00", in: 0, out: 0, occupancy: 0 },
  { hour: "10:00", in: 0, out: 0, occupancy: 0 },
  { hour: "12:00", in: 0, out: 0, occupancy: 0 },
  { hour: "14:00", in: 0, out: 0, occupancy: 0 },
  { hour: "16:00", in: 0, out: 0, occupancy: 0 },
  { hour: "18:00", in: 0, out: 0, occupancy: 0 },
  { hour: "20:00", in: 0, out: 0, occupancy: 0 },
];

export function InOutChart({ data }: InOutChartProps) {
  const chartData = data && data.length > 0 ? data : defaultData;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barGap={4}>
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
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            formatter={(value) => (
              <span className="text-sm text-muted-foreground capitalize">
                {value}
              </span>
            )}
          />
          <Bar
            dataKey="in"
            fill="hsl(142 71% 45%)"
            radius={[4, 4, 0, 0]}
            name="People In"
          />
          <Bar
            dataKey="out"
            fill="hsl(0 72% 51%)"
            radius={[4, 4, 0, 0]}
            name="People Out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
