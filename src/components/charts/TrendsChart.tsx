import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";

type Trend = {
  id: number;
  title: string;
  trendData: string;
  sentimentScore: number | null;
  source: string | null;
  createdAt: Date;
};

type Props = {
  trends: Trend[];
};

export function TrendsChart({ trends }: Props) {
  if (trends.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">No trends data available</p>
        </div>
      </div>
    );
  }

  // Transform trends data for the chart
  const chartData = trends
    .map((trend) => ({
      date: new Date(trend.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      sentiment: trend.sentimentScore || 0,
      title: trend.title,
      fullDate: new Date(trend.createdAt).toLocaleDateString(),
    }))
    .reverse(); // Show oldest to newest

  const avgSentiment =
    chartData.reduce((sum, item) => sum + item.sentiment, 0) / chartData.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-700">
            Sentiment Trend
          </h4>
          <p className="text-xs text-gray-500">
            Average: {avgSentiment.toFixed(2)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span className="text-xs text-gray-600">Sentiment Score</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            stroke="#6B7280"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            stroke="#6B7280"
            style={{ fontSize: "12px" }}
            domain={[0, 100]}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                    <p className="font-semibold text-gray-900 mb-1">
                      {data.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      Date: {data.fullDate}
                    </p>
                    <p className="text-sm text-gray-600">
                      Sentiment: {data.sentiment.toFixed(2)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="sentiment"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: "#3B82F6", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Highest Sentiment</p>
          <p className="text-lg font-bold text-blue-600">
            {Math.max(...chartData.map((d) => d.sentiment)).toFixed(2)}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Latest Sentiment</p>
          <p className="text-lg font-bold text-gray-900">
            {chartData[chartData.length - 1]?.sentiment.toFixed(2) || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}
