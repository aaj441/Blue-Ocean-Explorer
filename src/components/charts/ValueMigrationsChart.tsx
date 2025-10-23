import { ArrowRight, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { useState } from "react";

type ValueMigration = {
  id: number;
  name: string;
  description: string;
  fromIndustry: string;
  toIndustry: string;
  migrationDrivers: Array<{ type: string; description: string }>;
  timeline: string;
  confidence: number;
  impactAssessment: string;
  opportunityWindow: string;
  predictedMarketSize: number | null;
};

type Props = {
  migrations: ValueMigration[];
};

const TIMELINE_COLORS: Record<string, { bg: string; text: string }> = {
  short_term: { bg: "bg-red-100", text: "text-red-700" },
  medium_term: { bg: "bg-yellow-100", text: "text-yellow-700" },
  long_term: { bg: "bg-blue-100", text: "text-blue-700" },
};

export function ValueMigrationsChart({ migrations }: Props) {
  const [selectedMigration, setSelectedMigration] = useState<ValueMigration | null>(null);

  if (migrations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">No value migrations found</p>
          <p className="text-xs text-gray-500 mt-1">
            Run value migration analysis to predict shifts
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {migrations.map((migration) => {
          const timelineInfo = TIMELINE_COLORS[migration.timeline] || TIMELINE_COLORS.medium_term;
          
          return (
            <div
              key={migration.id}
              onClick={() => setSelectedMigration(migration)}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                    {migration.fromIndustry}
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div className="px-3 py-1 bg-blue-100 rounded-lg text-sm font-medium text-blue-700">
                    {migration.toIndustry}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${timelineInfo.bg} ${timelineInfo.text}`}>
                    {migration.timeline.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${migration.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600 font-medium">
                      {(migration.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              <h4 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {migration.name}
              </h4>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {migration.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {migration.migrationDrivers.length} drivers
                </span>
                {migration.predictedMarketSize && (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <TrendingUp className="w-3 h-3" />
                    ${migration.predictedMarketSize.toLocaleString()}M market
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selectedMigration && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMigration(null)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedMigration.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${TIMELINE_COLORS[selectedMigration.timeline].bg} ${TIMELINE_COLORS[selectedMigration.timeline].text}`}>
                    {selectedMigration.timeline.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm text-gray-500">
                    Confidence: {(selectedMigration.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedMigration(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Migration Path</h4>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="px-3 py-1 bg-white border border-gray-200 rounded text-sm font-medium">
                    {selectedMigration.fromIndustry}
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-600" />
                  <div className="px-3 py-1 bg-blue-100 border border-blue-200 rounded text-sm font-medium text-blue-700">
                    {selectedMigration.toIndustry}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                <p className="text-sm text-gray-600">{selectedMigration.description}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Migration Drivers</h4>
                <div className="space-y-2">
                  {selectedMigration.migrationDrivers.map((driver, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                      <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded capitalize">
                        {driver.type}
                      </span>
                      <p className="text-sm text-gray-600 flex-1">{driver.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Impact Assessment</h4>
                <p className="text-sm text-gray-600">{selectedMigration.impactAssessment}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  Opportunity Window
                </h4>
                <p className="text-sm text-gray-600">{selectedMigration.opportunityWindow}</p>
              </div>

              {selectedMigration.predictedMarketSize && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-green-700 mb-1">Predicted Market Size</h4>
                  <p className="text-2xl font-bold text-green-700">
                    ${selectedMigration.predictedMarketSize.toLocaleString()}M
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
