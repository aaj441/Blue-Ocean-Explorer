import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Target } from "lucide-react";

type Segment = {
  id: number;
  name: string;
  size: number | null;
  growth: number | null;
};

type Props = {
  segments: Segment[];
};

export function SegmentSizeChart({ segments }: Props) {
  // Filter segments that have size data
  const segmentsWithData = segments.filter(
    (segment) => segment.size !== null || segment.growth !== null
  );

  if (segmentsWithData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <Target className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">No segment size data available</p>
          <p className="text-xs mt-1">Add size and growth data to segments to see visualization</p>
        </div>
      </div>
    );
  }

  const chartData = segmentsWithData.map((segment) => ({
    name: segment.name.length > 20 ? segment.name.substring(0, 20) + "..." : segment.name,
    fullName: segment.name,
    size: segment.size || 0,
    growth: segment.growth || 0,
  }));

  const maxSize = Math.max(...chartData.map((d) => d.size));
  const maxGrowth = Math.max(...chartData.map((d) => d.growth));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">
          Segment Analysis
        </h4>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span className="text-xs text-gray-600">Size ($M)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            <span className="text-xs text-gray-600">Growth (%)</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="name"
            stroke="#6B7280"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            yAxisId="left"
            stroke="#6B7280"
            style={{ fontSize: "12px" }}
            label={{ value: "Size ($M)", angle: -90, position: "insideLeft" }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#6B7280"
            style={{ fontSize: "12px" }}
            label={{ value: "Growth (%)", angle: 90, position: "insideRight" }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                    <p className="font-semibold text-gray-900 mb-2">
                      {data.fullName}
                    </p>
                    <p className="text-sm text-gray-600">
                      Size: ${data.size.toLocaleString()}M
                    </p>
                    <p className="text-sm text-gray-600">
                      Growth: {data.growth}%
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar yAxisId="left" dataKey="size" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="growth" fill="#10B981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Total Market Size</p>
          <p className="text-lg font-bold text-blue-600">
            ${chartData.reduce((sum, d) => sum + d.size, 0).toLocaleString()}M
          </p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Avg Growth Rate</p>
          <p className="text-lg font-bold text-green-600">
            {(chartData.reduce((sum, d) => sum + d.growth, 0) / chartData.length).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}
