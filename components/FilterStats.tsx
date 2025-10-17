import { Filter, X } from "lucide-react";

type FilterStatsProps = {
  totalCount: number;
  filteredCount: number;
  filterType: string;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
};

export function FilterStats({
  totalCount,
  filteredCount,
  filterType,
  onClearFilters,
  hasActiveFilters,
}: FilterStatsProps) {
  if (!hasActiveFilters) return null;
  
  const filteredPercentage = totalCount > 0 ? (filteredCount / totalCount) * 100 : 0;
  const hiddenCount = totalCount - filteredCount;
  
  return (
    <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-3">
        <Filter className="w-5 h-5 text-blue-600" />
        <div>
          <p className="text-sm font-semibold text-blue-900">
            Showing {filteredCount} of {totalCount} {filterType}
            <span className="ml-2 text-blue-600">
              ({filteredPercentage.toFixed(1)}%)
            </span>
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
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
        Clear filters
      </button>
    </div>
  );
}
