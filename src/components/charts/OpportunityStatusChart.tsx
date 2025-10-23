import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { AlertCircle, Clock, CheckCircle, XCircle } from "lucide-react";

type OpportunityStats = {
  identified: number;
  analyzing: number;
  approved: number;
  rejected: number;
};

type Props = {
  stats: OpportunityStats;
};

const COLORS = {
  identified: "#3B82F6", // blue-600
  analyzing: "#EAB308", // yellow-600
  approved: "#10B981", // green-600
  rejected: "#EF4444", // red-600
};

const STATUS_ICONS = {
  identified: AlertCircle,
  analyzing: Clock,
  approved: CheckCircle,
  rejected: XCircle,
};

export function OpportunityStatusChart({ stats }: Props) {
  const data = [
    { name: "Identified", value: stats.identified, color: COLORS.identified },
    { name: "Analyzing", value: stats.analyzing, color: COLORS.analyzing },
    { name: "Approved", value: stats.approved, color: COLORS.approved },
    { name: "Rejected", value: stats.rejected, color: COLORS.rejected },
  ].filter((item) => item.value > 0);

  const total = stats.identified + stats.analyzing + stats.approved + stats.rejected;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">No opportunities data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                    <p className="font-semibold text-gray-900">
                      {payload[0].name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Count: {payload[0].value}
                    </p>
                    <p className="text-sm text-gray-600">
                      Percentage: {((payload[0].value as number / total) * 100).toFixed(1)}%
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-3">
        {Object.entries(stats).map(([status, count]) => {
          const Icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS];
          const color = COLORS[status as keyof typeof COLORS];
          return (
            <div
              key={status}
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
            >
              <Icon className="w-4 h-4" style={{ color }} />
              <div>
                <p className="text-sm font-semibold text-gray-900 capitalize">
                  {status}
                </p>
                <p className="text-xs text-gray-600">{count} opportunities</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
