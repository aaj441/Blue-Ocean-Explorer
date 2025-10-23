import { GitBranch, Zap, TrendingUp } from "lucide-react";
import { useState } from "react";

type TrendIntersection = {
  id: number;
  name: string;
  description: string;
  trendIds: number[];
  intersectionType: string;
  strength: number;
  reasoning: string;
  potentialImpact: string;
  marketOpportunity: string | null;
  isUnexpected: boolean;
};

type Props = {
  intersections: TrendIntersection[];
};

const TYPE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  convergence: { bg: "bg-blue-100", text: "text-blue-700", icon: "🔵" },
  collision: { bg: "bg-red-100", text: "text-red-700", icon: "💥" },
  synergy: { bg: "bg-green-100", text: "text-green-700", icon: "✨" },
  disruption: { bg: "bg-purple-100", text: "text-purple-700", icon: "⚡" },
};

export function TrendIntersectionsChart({ intersections }: Props) {
  const [selectedIntersection, setSelectedIntersection] = useState<TrendIntersection | null>(null);

  if (intersections.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <GitBranch className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">No trend intersections found</p>
          <p className="text-xs text-gray-500 mt-1">
            Run trend analysis to discover patterns
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {intersections.map((intersection) => {
          const typeInfo = TYPE_COLORS[intersection.intersectionType] || TYPE_COLORS.convergence;
          
          return (
            <div
              key={intersection.id}
              onClick={() => setSelectedIntersection(intersection)}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{typeInfo.icon}</span>
                  <div>
                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {intersection.name}
                    </h4>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${typeInfo.bg} ${typeInfo.text}`}>
                      {intersection.intersectionType}
                    </span>
                  </div>
                </div>
                {intersection.isUnexpected && (
                  <span className="text-xs font-medium px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                    Unexpected
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {intersection.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-semibold text-gray-700">
                      {(intersection.strength * 100).toFixed(0)}%
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {intersection.trendIds.length} trends
                  </span>
                </div>
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  View Details →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selectedIntersection && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedIntersection(null)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedIntersection.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${TYPE_COLORS[selectedIntersection.intersectionType].bg} ${TYPE_COLORS[selectedIntersection.intersectionType].text}`}>
                    {selectedIntersection.intersectionType}
                  </span>
                  <span className="text-sm text-gray-500">
                    Strength: {(selectedIntersection.strength * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedIntersection(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                <p className="text-sm text-gray-600">{selectedIntersection.description}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Reasoning</h4>
                <p className="text-sm text-gray-600">{selectedIntersection.reasoning}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Potential Impact</h4>
                <p className="text-sm text-gray-600">{selectedIntersection.potentialImpact}</p>
              </div>

              {selectedIntersection.marketOpportunity && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Market Opportunity
                  </h4>
                  <p className="text-sm text-gray-600">{selectedIntersection.marketOpportunity}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
