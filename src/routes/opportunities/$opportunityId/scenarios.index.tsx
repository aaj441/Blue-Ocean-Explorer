import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Activity,
  Trash2,
  Edit2,
  Sparkles,
  AlertTriangle,
  DollarSign,
  Users,
  Clock,
  Target,
  BarChart3,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog } from "@headlessui/react";
import toast from "react-hot-toast";
import { HelpTooltip } from "~/components/HelpTooltip";

export const Route = createFileRoute("/opportunities/$opportunityId/scenarios/")({
  component: ScenariosPage,
});

interface ScenarioForm {
  name: string;
  description: string;
  marketSize: string;
  marketGrowth: string;
  competitorCount: string;
  pricing: string;
  costStructure: string;
  timeToMarket: string;
}

function ScenariosPage() {
  const { opportunityId } = Route.useParams();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);

  const scenariosQuery = useQuery(
    trpc.getScenarios.queryOptions({
      token: token || "",
      opportunityId: parseInt(opportunityId),
    }),
  );

  const createScenarioMutation = useMutation(
    trpc.createScenario.mutationOptions({
      onSuccess: () => {
        toast.success("Scenario created successfully!");
        setIsCreateModalOpen(false);
        scenariosQuery.refetch();
        reset();
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to create scenario");
      },
    }),
  );

  const deleteScenarioMutation = useMutation(
    trpc.deleteScenario.mutationOptions({
      onSuccess: () => {
        toast.success("Scenario deleted");
        scenariosQuery.refetch();
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to delete scenario");
      },
    }),
  );

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ScenarioForm>();

  const onSubmit = (data: ScenarioForm) => {
    createScenarioMutation.mutate({
      token: token || "",
      opportunityId: parseInt(opportunityId),
      name: data.name,
      description: data.description || undefined,
      marketSize: data.marketSize ? parseFloat(data.marketSize) : undefined,
      marketGrowth: data.marketGrowth ? parseFloat(data.marketGrowth) : undefined,
      competitorCount: data.competitorCount ? parseInt(data.competitorCount) : undefined,
      pricing: data.pricing ? parseFloat(data.pricing) : undefined,
      costStructure: data.costStructure ? parseFloat(data.costStructure) : undefined,
      timeToMarket: data.timeToMarket ? parseInt(data.timeToMarket) : undefined,
      generateProjections: true,
    });
  };

  const handleQuickScenario = (type: "optimistic" | "pessimistic" | "realistic") => {
    const templates = {
      optimistic: {
        name: "Optimistic Scenario",
        description: "Best-case scenario with favorable market conditions",
      },
      pessimistic: {
        name: "Pessimistic Scenario",
        description: "Worst-case scenario with challenging market conditions",
      },
      realistic: {
        name: "Realistic Scenario",
        description: "Most likely scenario based on current market conditions",
      },
    };

    createScenarioMutation.mutate({
      token: token || "",
      opportunityId: parseInt(opportunityId),
      ...templates[type],
      generateProjections: true,
    });
  };

  const handleDeleteScenario = (scenarioId: number) => {
    if (confirm("Are you sure you want to delete this scenario?")) {
      deleteScenarioMutation.mutate({
        token: token || "",
        scenarioId,
      });
    }
  };

  const scenarios = scenariosQuery.data || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                Scenario Planning
                <HelpTooltip
                  title="Scenario Planning"
                  content="Test your opportunity under different conditions. Create optimistic, realistic, and pessimistic scenarios to understand potential outcomes and risks. This helps you stress-test assumptions before committing resources."
                />
              </h1>
              <p className="text-gray-600">
                Model different outcomes and stress-test your opportunity
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Scenario
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 items-center">
            <HelpTooltip
              title="Quick Scenarios"
              content="Generate AI-powered scenarios instantly. Optimistic assumes favorable conditions, Realistic uses current trends, and Pessimistic models challenging market conditions."
              className="mr-2"
            />
            <button
              onClick={() => handleQuickScenario("optimistic")}
              disabled={createScenarioMutation.isPending}
              className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <TrendingUp className="w-4 h-4" />
              Generate Optimistic
            </button>
            <button
              onClick={() => handleQuickScenario("realistic")}
              disabled={createScenarioMutation.isPending}
              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Activity className="w-4 h-4" />
              Generate Realistic
            </button>
            <button
              onClick={() => handleQuickScenario("pessimistic")}
              disabled={createScenarioMutation.isPending}
              className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <TrendingDown className="w-4 h-4" />
              Generate Pessimistic
            </button>
          </div>
        </div>

        {/* Scenarios Grid */}
        {scenariosQuery.isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading scenarios...</p>
          </div>
        ) : scenarios.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="bg-gray-100 rounded-full p-6 w-fit mx-auto mb-4">
              <BarChart3 className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No scenarios yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create scenarios to explore different outcomes and test assumptions
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create First Scenario
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Comparison Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Scenario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Market Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Market Share
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        ROI
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {scenarios.map((scenario) => (
                      <tr key={scenario.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{scenario.name}</p>
                            {scenario.description && (
                              <p className="text-sm text-gray-500 mt-1">{scenario.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {scenario.marketSize ? `$${scenario.marketSize}M` : "-"}
                        </td>
                        <td className="px-6 py-4">
                          {scenario.projectedRevenue ? (
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="font-semibold text-gray-900">
                                ${scenario.projectedRevenue.toFixed(1)}M
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {scenario.projectedMarketShare ? (
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-blue-600" />
                              <span className="font-semibold text-gray-900">
                                {scenario.projectedMarketShare.toFixed(1)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {scenario.projectedROI ? (
                            <span className={`font-semibold ${scenario.projectedROI > 100 ? "text-green-600" : scenario.projectedROI > 50 ? "text-yellow-600" : "text-red-600"}`}>
                              {scenario.projectedROI.toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedScenario(scenario.id)}
                              className="p-1 text-blue-600 hover:text-blue-700"
                              title="View details"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteScenario(scenario.id)}
                              className="p-1 text-red-600 hover:text-red-700"
                              title="Delete scenario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed View */}
            {selectedScenario && scenarios.find((s) => s.id === selectedScenario) && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                {(() => {
                  const scenario = scenarios.find((s) => s.id === selectedScenario)!;
                  return (
                    <>
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {scenario.name}
                          </h3>
                          {scenario.description && (
                            <p className="text-gray-600">{scenario.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => setSelectedScenario(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            Market Assumptions
                          </h4>
                          <div className="space-y-2">
                            {scenario.marketSize && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Market Size (TAM):</span>
                                <span className="font-medium text-gray-900">
                                  ${scenario.marketSize}M
                                </span>
                              </div>
                            )}
                            {scenario.marketGrowth && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Growth Rate:</span>
                                <span className="font-medium text-gray-900">
                                  {scenario.marketGrowth}%
                                </span>
                              </div>
                            )}
                            {scenario.competitorCount !== null && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Competitors:</span>
                                <span className="font-medium text-gray-900">
                                  {scenario.competitorCount}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            Business Model
                          </h4>
                          <div className="space-y-2">
                            {scenario.pricing && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Pricing:</span>
                                <span className="font-medium text-gray-900">
                                  ${scenario.pricing}
                                </span>
                              </div>
                            )}
                            {scenario.costStructure && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Cost Structure:</span>
                                <span className="font-medium text-gray-900">
                                  {scenario.costStructure}%
                                </span>
                              </div>
                            )}
                            {scenario.timeToMarket && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Time to Market:</span>
                                <span className="font-medium text-gray-900">
                                  {scenario.timeToMarket} months
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {scenario.riskAssessment && (
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            Risk Assessment
                          </h4>
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {scenario.riskAssessment}
                            </p>
                          </div>
                        </div>
                      )}

                      {scenario.keyAssumptions && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            Key Assumptions
                          </h4>
                          <ul className="space-y-2">
                            {JSON.parse(scenario.keyAssumptions).map((assumption: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="text-blue-600 mt-1">•</span>
                                <span>{assumption}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Scenario Modal */}
      <Dialog
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
              Create New Scenario
            </Dialog.Title>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scenario Name
                </label>
                <input
                  {...register("name", { required: "Name is required" })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Optimistic, Conservative, Aggressive"
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  {...register("description")}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of this scenario"
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Market Assumptions
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Market Size (TAM in $M)
                    </label>
                    <input
                      {...register("marketSize")}
                      type="number"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Market Growth Rate (%)
                    </label>
                    <input
                      {...register("marketGrowth")}
                      type="number"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="15"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Competitors
                    </label>
                    <input
                      {...register("competitorCount")}
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="5"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Business Model Assumptions
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pricing ($)
                    </label>
                    <input
                      {...register("pricing")}
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="99"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost Structure (% of revenue)
                    </label>
                    <input
                      {...register("costStructure")}
                      type="number"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time to Market (months)
                    </label>
                    <input
                      {...register("timeToMarket")}
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="6"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">AI-Powered Projections</p>
                    <p className="text-blue-700">
                      Our AI will analyze your assumptions and generate realistic projections
                      for revenue, market share, ROI, and identify key risks.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createScenarioMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createScenarioMutation.isPending ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Create Scenario
                    </>
                  )}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
