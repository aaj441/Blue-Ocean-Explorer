import { Filter, X, TrendingDown, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";

type FilterStatsProps = {
  totalCount: number;
  filteredCount: number;
  filterType: string;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  showTrends?: boolean;
  previousCount?: number;
};

export function FilterStats({
  totalCount,
  filteredCount,
  filterType,
  onClearFilters,
  hasActiveFilters,
  showTrends = false,
  previousCount,
}: FilterStatsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (hasActiveFilters) {
      setIsVisible(true);
      setAnimationKey(prev => prev + 1);
    } else {
      setIsVisible(false);
    }
  }, [hasActiveFilters, filteredCount]);

  if (!hasActiveFilters) return null;
  
  const filteredPercentage = totalCount > 0 ? (filteredCount / totalCount) * 100 : 0;
  const hiddenCount = totalCount - filteredCount;
  
  // Calculate trend if previous count is provided
  const trend = previousCount !== undefined ? filteredCount - previousCount : 0;
  const trendPercentage = previousCount !== undefined && previousCount > 0 
    ? ((filteredCount - previousCount) / previousCount) * 100 
    : 0;

  return (
    <div 
      key={animationKey}
      className={`flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Filter className="w-5 h-5 text-blue-600" />
          {showTrends && trend !== 0 && (
            <div className="absolute -top-1 -right-1">
              {trend > 0 ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-600" />
              )}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-900">
            Showing {filteredCount} of {totalCount} {filterType}
            <span className="ml-2 text-blue-600">
              ({filteredPercentage.toFixed(1)}%)
            </span>
            {showTrends && trend !== 0 && (
              <span className={`ml-2 text-xs font-medium ${
                trend > 0 ? "text-green-600" : "text-red-600"
              }`}>
                {trend > 0 ? "+" : ""}{trend} ({trendPercentage > 0 ? "+" : ""}{trendPercentage.toFixed(1)}%)
              </span>
            )}
          </p>
          {hiddenCount > 0 && (
            <p className="text-xs text-blue-700">
              {hiddenCount} {filterType} hidden by filters
            </p>
          )}
        </div>
      </div>
      <button
        onClick={onClearFilters}
        className="group flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={`Clear all ${filterType} filters`}
      >
        <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
        <span className="hidden sm:inline">Clear filters</span>
        <span className="sm:hidden">Clear</span>
      </button>
    </div>
  );
}
