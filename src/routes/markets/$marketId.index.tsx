import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Waves,
  ArrowLeft,
  Plus,
  Target,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Sparkles,
  Network,
  Layers,
  Radio,
  MessageCircle,
  FolderPlus,
  BarChart3,
} from "lucide-react";
import { useState } from "react";
import { OpportunityStatusChart } from "~/components/charts/OpportunityStatusChart";
import { TrendsChart } from "~/components/charts/TrendsChart";
import { SegmentSizeChart } from "~/components/charts/SegmentSizeChart";
import { OpportunityConstellationChart } from "~/components/charts/OpportunityConstellationChart";
import { ExportMenu } from "~/components/ExportMenu";
import { FilterStats } from "~/components/FilterStats";
import { exportOpportunities, exportSegments, exportCompetitors, exportMarket } from "~/utils/export";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import toast from "react-hot-toast";

const marketDetailSearchSchema = z.object({
  // Trend filters
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  // Segment filters
  minSize: z.number().optional(),
  maxSize: z.number().optional(),
  minGrowth: z.number().optional(),
  maxGrowth: z.number().optional(),
  // Opportunity filters
  opportunityStatus: z.array(z.enum(["identified", "analyzing", "approved", "rejected"])).optional(),
});

export const Route = createFileRoute("/markets/$marketId/")({
  component: MarketDetailPage,
  validateSearch: zodValidator(marketDetailSearchSchema),
});

function MarketDetailPage() {
  const { marketId } = Route.useParams();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const [activeTab, setActiveTab] = useState<
    "overview" | "segments" | "competitors" | "opportunities" | "constellation"
  >("overview");
  const [selectedOpportunityForBoard, setSelectedOpportunityForBoard] = useState<number | null>(null);
  
  const search = Route.useSearch();

  const marketQuery = useQuery(
    trpc.getMarketDetails.queryOptions({
      token: token || "",
      marketId: parseInt(marketId),
      startDate: search.startDate ? new Date(search.startDate).toISOString() : undefined,
      endDate: search.endDate ? new Date(search.endDate).toISOString() : undefined,
      minSize: search.minSize,
      maxSize: search.maxSize,
      minGrowth: search.minGrowth,
      maxGrowth: search.maxGrowth,
    }),
  );

  const opportunitiesQuery = useQuery(
    trpc.getOpportunities.queryOptions({
      token: token || "",
      marketId: parseInt(marketId),
      status: search.opportunityStatus,
    }),
  );

  const connectionsQuery = useQuery(
    trpc.getOpportunityConnections.queryOptions({
      token: token || "",
      marketId: parseInt(marketId),
    }),
  );

  const boardsQuery = useQuery(
    trpc.getBoards.queryOptions({
      token: token || "",
    }),
  );

  const generateConnectionsMutation = useMutation(
    trpc.generateOpportunityConnections.mutationOptions({
      onSuccess: () => {
        toast.success("Opportunity connections generated!");
        connectionsQuery.refetch();
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to generate connections");
      },
    }),
  );

  const vibeCheckMutation = useMutation(
    trpc.generateVibeCheck.mutationOptions({
      onSuccess: () => {
        toast.success("Vibe check complete!");
        opportunitiesQuery.refetch();
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to generate vibe check");
      },
    }),
  );

  const addToBoardMutation = useMutation(
    trpc.addOpportunityToBoard.mutationOptions({
      onSuccess: () => {
        toast.success("Added to board!");
        setSelectedOpportunityForBoard(null);
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to add to board");
      },
    }),
  );

  const updateSearch = (updates: Partial<z.infer<typeof marketDetailSearchSchema>>) => {
    navigate({
      to: ".",
      search: (prev) => ({ ...prev, ...updates }),
      replace: true,
    });
  };

  const clearFilters = () => {
    navigate({
      to: ".",
      search: {},
      replace: true,
    });
  };

  const market = marketQuery.data;

  if (marketQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading market details...</p>
        </div>
      </div>
    );
  }

  if (marketQuery.isError || !market) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Market Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The market you're looking for doesn't exist or you don't have
            access to it.
          </p>
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const allOpportunities = market.segments.flatMap((s) => s.opportunities);
  const opportunityStats = {
    identified: allOpportunities.filter((o) => o.status === "identified")
      .length,
    analyzing: allOpportunities.filter((o) => o.status === "analyzing").length,
    approved: allOpportunities.filter((o) => o.status === "approved").length,
    rejected: allOpportunities.filter((o) => o.status === "rejected").length,
  };

  // Filter statistics
  const allSegmentsCount = market.segments.length;
  const hasSegmentFilters = !!(search.minSize || search.maxSize || search.minGrowth || search.maxGrowth);
  
  const allTrendsCount = market.trends.length;
  const hasTrendFilters = !!(search.startDate || search.endDate);
  
  const allOpportunitiesCount = allOpportunities.length;
  const filteredOpportunitiesCount = opportunitiesQuery.data?.length || 0;
  const hasOpportunityFilters = !!(search.opportunityStatus && search.opportunityStatus.length > 0);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "segments", label: "Segments" },
    { id: "competitors", label: "Competitors" },
    { id: "opportunities", label: "Opportunities" },
    { id: "constellation", label: "Constellation" },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 rounded-lg p-2">
                <Waves className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {market.name}
                </h1>
                <p className="text-xs text-gray-500">{market.sector}</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">
                {market.segments.length}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Segments</h3>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold text-gray-900">
                {market.competitors.length}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Competitors</h3>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-gray-900">
                {allOpportunities.length}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">
              Opportunities
            </h3>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
              <span className="text-2xl font-bold text-gray-900">
                {opportunityStats.approved}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Approved</h3>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                    activeTab === tab.id
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Description
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {market.description}
                    </p>
                  </div>
                  <ExportMenu
                    onExport={(format) => exportMarket(market, format)}
                    label="Export Market"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Opportunity Status Distribution
                    </h3>
                    <OpportunityStatusChart stats={opportunityStats} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">
                        Market Trends
                      </h3>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={search.startDate || ""}
                          onChange={(e) => updateSearch({ startDate: e.target.value || undefined })}
                          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Start date"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="date"
                          value={search.endDate || ""}
                          onChange={(e) => updateSearch({ endDate: e.target.value || undefined })}
                          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="End date"
                        />
                        {(search.startDate || search.endDate) && (
                          <button
                            onClick={() => updateSearch({ startDate: undefined, endDate: undefined })}
                            className="text-sm text-gray-600 hover:text-gray-900 underline"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                    <TrendsChart trends={market.trends} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "segments" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    Market Segments
                  </h3>
                  <div className="flex items-center gap-4">
                    <ExportMenu
                      onExport={(format) => exportSegments(market.segments, format)}
                      disabled={market.segments.length === 0}
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Size ($M):</label>
                      <input
                        type="number"
                        placeholder="Min"
                        value={search.minSize ?? ""}
                        onChange={(e) => updateSearch({ minSize: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-20 text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={search.maxSize ?? ""}
                        onChange={(e) => updateSearch({ maxSize: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-20 text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Growth (%):</label>
                      <input
                        type="number"
                        placeholder="Min"
                        value={search.minGrowth ?? ""}
                        onChange={(e) => updateSearch({ minGrowth: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-20 text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={search.maxGrowth ?? ""}
                        onChange={(e) => updateSearch({ maxGrowth: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-20 text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={() =>
                        navigate({ to: `/markets/${marketId}/segments/new` })
                      }
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Segment
                    </button>
                  </div>
                </div>

                <FilterStats
                  totalCount={allSegmentsCount}
                  filteredCount={market.segments.length}
                  filterType="segments"
                  onClearFilters={() => updateSearch({ minSize: undefined, maxSize: undefined, minGrowth: undefined, maxGrowth: undefined })}
                  hasActiveFilters={hasSegmentFilters}
                />

                {hasSegmentFilters && market.segments.length > 0 && (
                  <div className="mb-6" />
                )}

                {market.segments.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      No segments yet
                    </h4>
                    <p className="text-gray-600 mb-6">
                      Start by defining market segments to explore
                    </p>
                    <button
                      onClick={() =>
                        navigate({ to: `/markets/${marketId}/segments/new` })
                      }
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold inline-flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Create Segment
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {market.segments.map((segment) => (
                        <div
                          key={segment.id}
                          className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                          <h4 className="text-lg font-bold text-gray-900 mb-2">
                            {segment.name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-4">
                            {segment.characteristics}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {segment.size && (
                              <span>Size: ${segment.size.toLocaleString()}M</span>
                            )}
                            {segment.growth && (
                              <span>Growth: {segment.growth}%</span>
                            )}
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                              {segment.opportunities.length} opportunities
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        Segment Size Comparison
                      </h3>
                      <SegmentSizeChart segments={market.segments} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "competitors" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    Competitors
                  </h3>
                  <div className="flex items-center gap-3">
                    <ExportMenu
                      onExport={(format) => exportCompetitors(market.competitors, format)}
                      disabled={market.competitors.length === 0}
                    />
                    <button
                      onClick={() =>
                        navigate({ to: `/markets/${marketId}/competitors/new` })
                      }
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Competitor
                    </button>
                  </div>
                </div>

                {market.competitors.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      No competitors tracked
                    </h4>
                    <p className="text-gray-600 mb-6">
                      Add competitors to analyze the competitive landscape
                    </p>
                    <button
                      onClick={() =>
                        navigate({
                          to: `/markets/${marketId}/competitors/new`,
                        })
                      }
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold inline-flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Add Competitor
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {market.competitors.map((competitor) => (
                      <div
                        key={competitor.id}
                        className="border border-gray-200 rounded-lg p-6"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-lg font-bold text-gray-900">
                            {competitor.name}
                          </h4>
                          {competitor.marketShare && (
                            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded">
                              {competitor.marketShare}% market share
                            </span>
                          )}
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h5 className="text-sm font-semibold text-green-700 mb-2">
                              Strengths
                            </h5>
                            <p className="text-sm text-gray-600">
                              {competitor.strengths}
                            </p>
                          </div>
                          <div>
                            <h5 className="text-sm font-semibold text-red-700 mb-2">
                              Weaknesses
                            </h5>
                            <p className="text-sm text-gray-600">
                              {competitor.weaknesses}
                            </p>
                          </div>
                        </div>
                        {competitor.positioning && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h5 className="text-sm font-semibold text-gray-700 mb-2">
                              Positioning
                            </h5>
                            <p className="text-sm text-gray-600">
                              {competitor.positioning}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "opportunities" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    All Opportunities
                  </h3>
                  <div className="flex items-center gap-4">
                    <ExportMenu
                      onExport={(format) => exportOpportunities(opportunitiesQuery.data || [], format)}
                      disabled={!opportunitiesQuery.data || opportunitiesQuery.data.length === 0}
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Status:</label>
                      <div className="flex items-center gap-2">
                        {["identified", "analyzing", "approved", "rejected"].map((status) => (
                          <label key={status} className="flex items-center gap-1 text-sm">
                            <input
                              type="checkbox"
                              checked={search.opportunityStatus?.includes(status as any) || false}
                              onChange={(e) => {
                                const currentStatuses = search.opportunityStatus || [];
                                const newStatuses = e.target.checked
                                  ? [...currentStatuses, status as any]
                                  : currentStatuses.filter((s) => s !== status);
                                updateSearch({ opportunityStatus: newStatuses.length > 0 ? newStatuses : undefined });
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="capitalize">{status}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <FilterStats
                  totalCount={allOpportunitiesCount}
                  filteredCount={filteredOpportunitiesCount}
                  filterType="opportunities"
                  onClearFilters={() => updateSearch({ opportunityStatus: undefined })}
                  hasActiveFilters={hasOpportunityFilters}
                />

                {hasOpportunityFilters && filteredOpportunitiesCount > 0 && (
                  <div className="mb-6" />
                )}

                {opportunitiesQuery.isLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : !opportunitiesQuery.data || opportunitiesQuery.data.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      No opportunities found
                    </h4>
                    <p className="text-gray-600">
                      {search.opportunityStatus && search.opportunityStatus.length > 0
                        ? "Try adjusting your filters"
                        : "Create segments first, then add opportunities to them"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {opportunitiesQuery.data.map((opportunity) => {
                      const segment = opportunity.segment;
                      return (
                        <div
                          key={opportunity.id}
                          className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="text-lg font-bold text-gray-900 mb-1">
                                {opportunity.title}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {segment?.name}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-semibold px-3 py-1 rounded ${
                                  opportunity.status === "approved"
                                    ? "bg-green-100 text-green-700"
                                    : opportunity.status === "analyzing"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : opportunity.status === "rejected"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {opportunity.status}
                              </span>
                              <span className="text-lg font-bold text-blue-600">
                                {opportunity.score.toFixed(0)}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">
                            {opportunity.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span
                              className={`font-medium ${
                                opportunity.risk === "low"
                                  ? "text-green-600"
                                  : opportunity.risk === "high"
                                    ? "text-red-600"
                                    : "text-yellow-600"
                              }`}
                            >
                              Risk: {opportunity.risk}
                            </span>
                            {opportunity.revenue && (
                              <span>
                                Revenue: ${opportunity.revenue.toLocaleString()}
                                M
                              </span>
                            )}
                            {opportunity.roi && (
                              <span>ROI: {opportunity.roi}%</span>
                            )}
                            <button
                              onClick={() => navigate({ to: `/opportunities/${opportunity.id}/scenarios` })}
                              className="ml-auto flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium"
                            >
                              <BarChart3 className="w-4 h-4" />
                              Scenarios
                            </button>
                            <button
                              onClick={() => setSelectedOpportunityForBoard(opportunity.id)}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                            >
                              <FolderPlus className="w-4 h-4" />
                              Add to Board
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "constellation" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      Opportunity Constellation
                    </h3>
                    <p className="text-sm text-gray-600">
                      Visualize connections and patterns between opportunities
                    </p>
                  </div>
                  <button
                    onClick={() => generateConnectionsMutation.mutate({
                      token: token || "",
                      marketId: parseInt(marketId),
                    })}
                    disabled={generateConnectionsMutation.isPending || allOpportunities.length < 2}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generateConnectionsMutation.isPending ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Connections
                      </>
                    )}
                  </button>
                </div>
                
                {connectionsQuery.isLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading constellation...</p>
                  </div>
                ) : !connectionsQuery.data || connectionsQuery.data.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <Network className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      No connections yet
                    </h4>
                    <p className="text-gray-600 mb-6">
                      {allOpportunities.length < 2
                        ? "Create at least 2 opportunities to generate connections"
                        : "Click 'Generate Connections' to discover patterns between your opportunities"}
                    </p>
                  </div>
                ) : (
                  <>
                    <OpportunityConstellationChart
                      opportunities={allOpportunities.map(o => ({
                        id: o.id,
                        title: o.title,
                        status: o.status,
                        score: o.score,
                      }))}
                      connections={connectionsQuery.data.map(c => ({
                        sourceOpportunityId: c.sourceOpportunityId,
                        targetOpportunityId: c.targetOpportunityId,
                        connectionType: c.connectionType,
                        strength: c.strength,
                        reasoning: c.reasoning || undefined,
                      }))}
                    />
                    
                    <div className="mt-6 space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700">
                        Connection Insights
                      </h4>
                      {connectionsQuery.data.slice(0, 5).map((conn, i) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900 mb-1">
                                {conn.sourceOpportunity.title} ↔ {conn.targetOpportunity.title}
                              </p>
                              <p className="text-xs text-gray-600 mb-2">
                                Type: <span className="capitalize">{conn.connectionType.replace('_', ' ')}</span> • 
                                Strength: {(conn.strength * 100).toFixed(0)}%
                              </p>
                              {conn.reasoning && (
                                <p className="text-sm text-gray-700">{conn.reasoning}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add to Board Modal */}
      {selectedOpportunityForBoard && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Add to Board
            </h3>
            {boardsQuery.isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : !boardsQuery.data || boardsQuery.data.length === 0 ? (
              <div className="text-center py-8">
                <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No boards yet</p>
                <button
                  onClick={() => navigate({ to: "/boards" })}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create a board first
                </button>
              </div>
            ) : (
              <div className="space-y-2 mb-6">
                {boardsQuery.data.map((board) => (
                  <button
                    key={board.id}
                    onClick={() => {
                      addToBoardMutation.mutate({
                        token: token || "",
                        boardId: board.id,
                        opportunityId: selectedOpportunityForBoard,
                      });
                    }}
                    disabled={addToBoardMutation.isPending}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{board.name}</p>
                        <p className="text-sm text-gray-500">{board.stage}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {board._count?.opportunities || 0} opportunities
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setSelectedOpportunityForBoard(null)}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
