import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppNav } from "~/components/AppNav";
import { HelpTooltip } from "~/components/HelpTooltip";
import {
  Plus,
  Sparkles,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog } from "@headlessui/react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/strategy/canvas/")({
  component: BlueOceanCanvasPage,
});

interface CanvasForm {
  name: string;
  description: string;
  marketId: string;
  opportunityId: string;
  generateSuggestions: boolean;
}

function BlueOceanCanvasPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { token, isAuthenticated } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCanvas, setSelectedCanvas] = useState<number | null>(null);
  const [editingERRC, setEditingERRC] = useState<{
    eliminate: string[];
    reduce: string[];
    raise: string[];
    create: string[];
  } | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/auth/login" });
    }
  }, [isAuthenticated, navigate]);

  const canvasesQuery = useQuery(
    trpc.getBlueOceanCanvases.queryOptions({
      token: token || "",
    }),
  );

  const marketsQuery = useQuery(
    trpc.getMarkets.queryOptions({
      token: token || "",
    }),
  );

  const createCanvasMutation = useMutation(
    trpc.createBlueOceanCanvas.mutationOptions({
      onSuccess: () => {
        toast.success("Canvas created successfully!");
        setIsCreateModalOpen(false);
        canvasesQuery.refetch();
        reset();
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to create canvas");
      },
    }),
  );

  const updateCanvasMutation = useMutation(
    trpc.updateBlueOceanCanvas.mutationOptions({
      onSuccess: () => {
        toast.success("Canvas updated!");
        canvasesQuery.refetch();
        setEditingERRC(null);
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to update canvas");
      },
    }),
  );

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<CanvasForm>();

  const generateSuggestions = watch("generateSuggestions");

  const onSubmit = (data: CanvasForm) => {
    createCanvasMutation.mutate({
      token: token || "",
      name: data.name,
      description: data.description || undefined,
      marketId: data.marketId ? parseInt(data.marketId) : undefined,
      opportunityId: data.opportunityId ? parseInt(data.opportunityId) : undefined,
      generateSuggestions: data.generateSuggestions,
    });
  };

  const handleSaveERRC = () => {
    if (!selectedCanvas || !editingERRC) return;

    updateCanvasMutation.mutate({
      token: token || "",
      canvasId: selectedCanvas,
      eliminate: editingERRC.eliminate,
      reduce: editingERRC.reduce,
      raise: editingERRC.raise,
      create: editingERRC.create,
    });
  };

  const canvases = canvasesQuery.data || [];
  const markets = marketsQuery.data || [];
  const selectedCanvasData = canvases.find((c) => c.id === selectedCanvas);

  const statusColors = {
    draft: "bg-gray-100 text-gray-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
  };

  const statusIcons = {
    draft: Circle,
    in_progress: Loader2,
    completed: CheckCircle2,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav currentPage="strategy" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                Blue Ocean Canvas
                <HelpTooltip
                  title="Blue Ocean Canvas"
                  content="Use the ERRC (Eliminate-Reduce-Raise-Create) framework to design your Blue Ocean strategy. Identify what factors to eliminate, reduce, raise, and create to unlock new market space and make competition irrelevant."
                />
              </h1>
              <p className="text-gray-600">
                Design value innovation strategies with the ERRC framework
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Canvas
            </button>
          </div>
        </div>

        {/* Canvases Grid */}
        {canvasesQuery.isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading canvases...</p>
          </div>
        ) : canvases.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="bg-blue-100 rounded-full p-6 w-fit mx-auto mb-4">
              <Sparkles className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No canvases yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first Blue Ocean Canvas to start designing value innovation strategies
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Canvas
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {canvases.map((canvas) => {
                const StatusIcon = statusIcons[canvas.status as keyof typeof statusIcons];
                return (
                  <div
                    key={canvas.id}
                    onClick={() => setSelectedCanvas(canvas.id)}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">{canvas.name}</h3>
                      <span className={`text-xs font-medium px-2 py-1 rounded flex items-center gap-1 ${statusColors[canvas.status as keyof typeof statusColors]}`}>
                        <StatusIcon className="w-3 h-3" />
                        {canvas.status.replace("_", " ")}
                      </span>
                    </div>
                    {canvas.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {canvas.description}
                      </p>
                    )}
                    {canvas.valueInnovation && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                        <p className="text-xs font-medium text-blue-900 mb-1">Value Innovation</p>
                        <p className="text-sm text-blue-700 line-clamp-2">{canvas.valueInnovation}</p>
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Created {new Date(canvas.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Canvas Detail */}
            {selectedCanvasData && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedCanvasData.name}
                    </h2>
                    {selectedCanvasData.description && (
                      <p className="text-gray-600">{selectedCanvasData.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedCanvas(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {selectedCanvasData.valueInnovation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">
                      Value Innovation Strategy
                    </h3>
                    <p className="text-sm text-blue-700">{selectedCanvasData.valueInnovation}</p>
                  </div>
                )}

                {/* ERRC Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Eliminate */}
                  <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
                    <h3 className="text-lg font-bold text-red-900 mb-3 flex items-center gap-2">
                      Eliminate
                      <HelpTooltip
                        title="Eliminate"
                        content="What factors that the industry takes for granted should be eliminated?"
                      />
                    </h3>
                    <ul className="space-y-2">
                      {JSON.parse(selectedCanvasData.eliminate).map((item: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-red-800">
                          <span className="text-red-600 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Reduce */}
                  <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
                    <h3 className="text-lg font-bold text-orange-900 mb-3 flex items-center gap-2">
                      Reduce
                      <HelpTooltip
                        title="Reduce"
                        content="What factors should be reduced well below the industry's standard?"
                      />
                    </h3>
                    <ul className="space-y-2">
                      {JSON.parse(selectedCanvasData.reduce).map((item: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-orange-800">
                          <span className="text-orange-600 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Raise */}
                  <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                    <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                      Raise
                      <HelpTooltip
                        title="Raise"
                        content="What factors should be raised well above the industry's standard?"
                      />
                    </h3>
                    <ul className="space-y-2">
                      {JSON.parse(selectedCanvasData.raise).map((item: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Create */}
                  <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                    <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
                      Create
                      <HelpTooltip
                        title="Create"
                        content="What factors should be created that the industry has never offered?"
                      />
                    </h3>
                    <ul className="space-y-2">
                      {JSON.parse(selectedCanvasData.create).map((item: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-green-800">
                          <span className="text-green-600 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Canvas Modal */}
      <Dialog
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
              Create Blue Ocean Canvas
            </Dialog.Title>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Canvas Name
                </label>
                <input
                  {...register("name", { required: "Name is required" })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Healthcare Innovation Strategy"
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
                  placeholder="Brief description of this canvas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link to Market (optional)
                </label>
                <select
                  {...register("marketId")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a market...</option>
                  {markets.map((market) => (
                    <option key={market.id} value={market.id}>
                      {market.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  {...register("generateSuggestions")}
                  type="checkbox"
                  id="generateSuggestions"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="generateSuggestions" className="text-sm text-gray-700">
                  Generate AI suggestions for ERRC factors
                </label>
              </div>

              {generateSuggestions && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-1">AI-Powered ERRC Analysis</p>
                      <p className="text-blue-700">
                        Our AI will analyze your market context and suggest specific factors to
                        eliminate, reduce, raise, and create based on Blue Ocean Strategy principles.
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                  disabled={createCanvasMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createCanvasMutation.isPending ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Create Canvas
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
