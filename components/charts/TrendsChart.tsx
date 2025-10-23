import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  ReferenceLine,
  Brush,
} from "recharts";
import { TrendingUp, TrendingDown, Activity, Calendar, BarChart3 } from "lucide-react";
import { useState, useMemo } from "react";

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
  showArea?: boolean;
  showBrush?: boolean;
  height?: number;
  showInsights?: boolean;
};

export function TrendsChart({ 
  trends, 
  showArea = false, 
  showBrush = false, 
  height = 300,
  showInsights = true 
}: Props) {
  const [selectedDataPoint, setSelectedDataPoint] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'line' | 'area'>('line');

  const chartData = useMemo(() => {
    return trends
      .map((trend) => ({
        date: new Date(trend.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        sentiment: trend.sentimentScore || 0,
        title: trend.title,
        fullDate: new Date(trend.createdAt).toLocaleDateString(),
        timestamp: new Date(trend.createdAt).getTime(),
        source: trend.source,
      }))
      .sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp
  }, [trends]);

  const insights = useMemo(() => {
    if (chartData.length === 0) return null;

    const sentiments = chartData.map(d => d.sentiment);
    const avgSentiment = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
    const maxSentiment = Math.max(...sentiments);
    const minSentiment = Math.min(...sentiments);
    const latestSentiment = sentiments[sentiments.length - 1];
    const previousSentiment = sentiments.length > 1 ? sentiments[sentiments.length - 2] : latestSentiment;
    
    const trend = latestSentiment > previousSentiment ? 'up' : latestSentiment < previousSentiment ? 'down' : 'stable';
    const trendPercentage = previousSentiment > 0 ? ((latestSentiment - previousSentiment) / previousSentiment) * 100 : 0;

    return {
      avgSentiment,
      maxSentiment,
      minSentiment,
      latestSentiment,
      trend,
      trendPercentage: Math.abs(trendPercentage),
      volatility: Math.max(...sentiments) - Math.min(...sentiments),
    };
  }, [chartData]);

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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      setSelectedDataPoint(data);
      return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-4 max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <p className="font-semibold text-gray-900 text-sm">{data.title}</p>
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-gray-600">
              <Calendar className="w-3 h-3 inline mr-1" />
              {data.fullDate}
            </p>
            <p className="text-gray-600">
              Sentiment: <span className="font-semibold">{data.sentiment.toFixed(2)}</span>
            </p>
            {data.source && (
              <p className="text-gray-500">Source: {data.source}</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-700">
            Sentiment Trend
          </h4>
          {insights && (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-500">
                Average: {insights.avgSentiment.toFixed(2)}
              </p>
              {insights.trend !== 'stable' && (
                <div className={`flex items-center gap-1 text-xs ${
                  insights.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {insights.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {insights.trendPercentage.toFixed(1)}%
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('line')}
              className={`p-1 rounded ${viewMode === 'line' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('area')}
              className={`p-1 rounded ${viewMode === 'area' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Activity className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span className="text-xs text-gray-600">Sentiment Score</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        {viewMode === 'area' ? (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
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
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="sentiment"
              stroke="#3B82F6"
              fill="url(#sentimentGradient)"
              strokeWidth={2}
            />
            {insights && (
              <ReferenceLine 
                y={insights.avgSentiment} 
                stroke="#6B7280" 
                strokeDasharray="5 5" 
                label={{ value: "Avg", position: "topRight" }}
              />
            )}
            {showBrush && <Brush dataKey="date" height={30} />}
          </AreaChart>
        ) : (
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
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="sentiment"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: "#3B82F6", r: 4 }}
              activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
            />
            {insights && (
              <ReferenceLine 
                y={insights.avgSentiment} 
                stroke="#6B7280" 
                strokeDasharray="5 5" 
                label={{ value: "Avg", position: "topRight" }}
              />
            )}
            {showBrush && <Brush dataKey="date" height={30} />}
          </LineChart>
        )}
      </ResponsiveContainer>

      {showInsights && insights && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Highest</p>
            <p className="text-lg font-bold text-blue-600">
              {insights.maxSentiment.toFixed(2)}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Latest</p>
            <p className="text-lg font-bold text-gray-900">
              {insights.latestSentiment.toFixed(2)}
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Average</p>
            <p className="text-lg font-bold text-green-600">
              {insights.avgSentiment.toFixed(2)}
            </p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Volatility</p>
            <p className="text-lg font-bold text-purple-600">
              {insights.volatility.toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
