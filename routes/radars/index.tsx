import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppNav } from "~/components/AppNav";
import { HelpTooltip } from "~/components/HelpTooltip";
import {
  Plus,
  Radar as RadarIcon,
  Trash2,
  Eye,
  Bell,
  BellOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog } from "@headlessui/react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/radars/")({
  component: RadarsPage,
});

interface CreateRadarForm {
  name: string;
  description: string;
  industries: string;
  keywords: string;
  maxCompetitors: string;
  minTAM: string;
  maxEntryBarrier: "low" | "medium" | "high";
  alertFrequency: "realtime" | "daily" | "weekly";
}

function RadarsPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { token, isAuthenticated } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/auth/login" });
    }
  }, [isAuthenticated, navigate]);

  const radarsQuery = useQuery(
    trpc.getRadars.queryOptions({
      token: token || "",
    }),
  );

  const createRadarMutation = useMutation(
    trpc.createRadar.mutationOptions({
      onSuccess: () => {
        toast.success("Radar created successfully!");
        setIsCreateModalOpen(false);
        radarsQuery.refetch();
        reset();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create radar");
      },
    }),
  );

  const deleteRadarMutation = useMutation(
    trpc.deleteRadar.mutationOptions({
      onSuccess: () => {
        toast.success("Radar deleted");
        radarsQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete radar");
      },
    }),
  );

  const toggleRadarMutation = useMutation(
    trpc.updateRadar.mutationOptions({
      onSuccess: () => {
        toast.success("Radar updated");
        radarsQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update radar");
      },
    }),
  );

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateRadarForm>();

  const onSubmit = (data: CreateRadarForm) => {
    const industries = data.industries
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const keywords = data.keywords
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    createRadarMutation.mutate({
      token: token || "",
      name: data.name,
      description: data.description,
      criteria: {
        industries: industries.length > 0 ? industries : undefined,
        keywords: keywords.length > 0 ? keywords : undefined,
        maxCompetitors: data.maxCompetitors ? parseInt(data.maxCompetitors) : undefined,
        minTAM: data.minTAM ? parseInt(data.minTAM) : undefined,
        maxEntryBarrier: data.maxEntryBarrier || undefined,
      },
      alertFrequency: data.alertFrequency,
    });
  };

  const handleDeleteRadar = (radarId: number) => {
    if (confirm("Are you sure you want to delete this radar?")) {
      deleteRadarMutation.mutate({
        token: token || "",
        radarId,
      });
    }
  };

  const handleToggleRadar = (radarId: number, isActive: boolean) => {
    toggleRadarMutation.mutate({
      token: token || "",
      radarId,
      isActive: !isActive,
    });
  };

  const radars = radarsQuery.data || [];

  const frequencyLabels = {
    realtime: "Real-time",
    daily: "Daily",
    weekly: "Weekly",
  };

  const frequencyColors = {
    realtime: "bg-red-100 text-red-700",
    daily: "bg-yellow-100 text-yellow-700",
    weekly: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav currentPage="radars" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                Trend Radars
                <HelpTooltip
                  title="Trend Radars"
                  content="Set up continuous monitoring for opportunities matching your criteria. Radars automatically scan for new opportunities based on industries, keywords, competitor counts, and other filters you define. Get alerted when promising opportunities emerge."
                />
              </h1>
              <p className="text-gray-600">
                Set up continuous monitoring for opportunities matching your criteria
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Radar
            </button>
          </div>
        </div>

        {/* Radars Grid */}
        {radarsQuery.isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading radars...</p>
          </div>
        ) : radars.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="bg-gray-100 rounded-full p-6 w-fit mx-auto mb-4">
              <RadarIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No radars yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first radar to start monitoring opportunities
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Radar
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {radars.map((radar) => {
              const criteria = JSON.parse(radar.criteria);
              return (
                <div
                  key={radar.id}
                  className={`bg-white border rounded-lg p-6 hover:shadow-lg transition-all ${radar.isActive ? "border-gray-200" : "border-gray-300 opacity-60"}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`rounded-lg p-3 ${radar.isActive ? "bg-blue-100" : "bg-gray-100"}`}>
                      <RadarIcon className={`w-6 h-6 ${radar.isActive ? "text-blue-600" : "text-gray-400"}`} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${frequencyColors[radar.alertFrequency as keyof typeof frequencyColors]}`}
                      >
                        {frequencyLabels[radar.alertFrequency as keyof typeof frequencyLabels]}
                      </span>
                      <button
                        onClick={() => handleToggleRadar(radar.id, radar.isActive)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title={radar.isActive ? "Pause radar" : "Activate radar"}
                      >
                        {radar.isActive ? (
                          <Bell className="w-4 h-4" />
                        ) : (
                          <BellOff className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteRadar(radar.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete radar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {radar.name}
                  </h3>
                  {radar.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {radar.description}
                    </p>
                  )}
                  <div className="space-y-2 mb-4">
                    {criteria.industries && criteria.industries.length > 0 && (
                      <div className="text-xs">
                        <span className="font-medium text-gray-700">Industries:</span>
                        <span className="text-gray-600 ml-1">
                          {criteria.industries.join(", ")}
                        </span>
                      </div>
                    )}
                    {criteria.keywords && criteria.keywords.length > 0 && (
                      <div className="text-xs">
                        <span className="font-medium text-gray-700">Keywords:</span>
                        <span className="text-gray-600 ml-1">
                          {criteria.keywords.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {radar.matchCount} matches
                    </span>
                    <button
                      onClick={() => navigate({ to: `/radars/${radar.id}` })}
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </div>
                  {radar.lastChecked && (
                    <p className="text-xs text-gray-400 mt-2">
                      Last checked: {new Date(radar.lastChecked).toLocaleString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Radar Modal */}
      <Dialog
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
              Create New Radar
            </Dialog.Title>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Radar Name
                </label>
                <input
                  {...register("name", { required: "Name is required" })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="AI + Healthcare"
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
                  placeholder="Monitor AI opportunities in healthcare"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industries (comma-separated)
                </label>
                <input
                  {...register("industries")}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Healthcare, SaaS, Education"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keywords (comma-separated)
                </label>
                <input
                  {...register("keywords")}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="AI, automation, telemedicine"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Competitors (optional)
                </label>
                <input
                  {...register("maxCompetitors")}
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Entry Barrier
                </label>
                <select
                  {...register("maxEntryBarrier")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium or lower</option>
                  <option value="high">Any (including high)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Frequency
                </label>
                <select
                  {...register("alertFrequency")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="weekly">Weekly</option>
                  <option value="daily">Daily</option>
                  <option value="realtime">Real-time</option>
                </select>
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
                  disabled={createRadarMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
                >
                  {createRadarMutation.isPending ? "Creating..." : "Create Radar"}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
