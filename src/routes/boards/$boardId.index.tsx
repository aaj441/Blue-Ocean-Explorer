import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppNav } from "~/components/AppNav";
import {
  ArrowLeft,
  Trash2,
  TrendingUp,
  Edit,
  ExternalLink,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

export const Route = createFileRoute("/boards/$boardId/")({
  component: BoardDetailPage,
});

interface UpdateBoardForm {
  name: string;
  description: string;
  stage: "exploring" | "validating" | "building" | "live";
}

function BoardDetailPage() {
  const { boardId } = Route.useParams();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { token, isAuthenticated } = useAuthStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/auth/login" });
    }
  }, [isAuthenticated, navigate]);

  const boardQuery = useQuery(
    trpc.getBoardDetails.queryOptions({
      token: token || "",
      boardId: parseInt(boardId),
    }),
  );

  const updateBoardMutation = useMutation(
    trpc.updateBoard.mutationOptions({
      onSuccess: () => {
        toast.success("Board updated successfully!");
        setIsEditModalOpen(false);
        boardQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update board");
      },
    }),
  );

  const removeOpportunityMutation = useMutation(
    trpc.removeOpportunityFromBoard.mutationOptions({
      onSuccess: () => {
        toast.success("Opportunity removed from board");
        boardQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to remove opportunity");
      },
    }),
  );

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UpdateBoardForm>();

  useEffect(() => {
    if (boardQuery.data) {
      reset({
        name: boardQuery.data.name,
        description: boardQuery.data.description || "",
        stage: boardQuery.data.stage as any,
      });
    }
  }, [boardQuery.data, reset]);

  const onSubmit = (data: UpdateBoardForm) => {
    updateBoardMutation.mutate({
      token: token || "",
      boardId: parseInt(boardId),
      ...data,
    });
  };

  const handleRemoveOpportunity = (opportunityId: number) => {
    if (confirm("Remove this opportunity from the board?")) {
      removeOpportunityMutation.mutate({
        token: token || "",
        boardId: parseInt(boardId),
        opportunityId,
      });
    }
  };

  const board = boardQuery.data;

  const stageColors = {
    exploring: "bg-blue-100 text-blue-700",
    validating: "bg-yellow-100 text-yellow-700",
    building: "bg-purple-100 text-purple-700",
    live: "bg-green-100 text-green-700",
  };

  const stageLabels = {
    exploring: "Exploring",
    validating: "Validating",
    building: "Building",
    live: "Live",
  };

  const riskColors = {
    low: "text-green-600 bg-green-100",
    medium: "text-yellow-600 bg-yellow-100",
    high: "text-red-600 bg-red-100",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav currentPage="boards" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {boardQuery.isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading board...</p>
          </div>
        ) : !board ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Board not found</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={() => navigate({ to: "/boards" })}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Boards
              </button>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {board.name}
                    </h1>
                    <span
                      className={`text-sm font-medium px-3 py-1 rounded ${stageColors[board.stage as keyof typeof stageColors]}`}
                    >
                      {stageLabels[board.stage as keyof typeof stageLabels]}
                    </span>
                  </div>
                  {board.description && (
                    <p className="text-gray-600">{board.description}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    {board.opportunities.length} opportunities
                  </p>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Board
                </button>
              </div>
            </div>

            {/* Opportunities */}
            {board.opportunities.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <div className="bg-gray-100 rounded-full p-6 w-fit mx-auto mb-4">
                  <TrendingUp className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No opportunities yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Add opportunities to this board from your markets
                </p>
                <button
                  onClick={() => navigate({ to: "/dashboard" })}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                >
                  Go to Markets
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {board.opportunities.map((boardOpp) => {
                  const opp = boardOpp.opportunity;
                  return (
                    <div
                      key={boardOpp.id}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">
                              {opp.title}
                            </h3>
                            <span
                              className={`text-xs font-medium px-2 py-1 rounded ${riskColors[opp.risk as keyof typeof riskColors]}`}
                            >
                              {opp.risk} risk
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            {opp.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>
                              Market: {opp.segment.market.name}
                            </span>
                            <span>•</span>
                            <span>Segment: {opp.segment.name}</span>
                            <span>•</span>
                            <span>Score: {opp.score.toFixed(1)}</span>
                            {opp.insight && (
                              <>
                                <span>•</span>
                                <span>
                                  Alignment: {opp.insight.alignmentScore?.toFixed(0)}%
                                </span>
                              </>
                            )}
                          </div>
                          {boardOpp.notes && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Notes:</span>{" "}
                                {boardOpp.notes}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() =>
                              navigate({
                                to: `/markets/${opp.segment.market.id}`,
                              })
                            }
                            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                            title="View market"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleRemoveOpportunity(opp.id)}
                            className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                            title="Remove from board"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Board Modal */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl p-6 max-w-md w-full">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
              Edit Board
            </Dialog.Title>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Board Name
                </label>
                <input
                  {...register("name", { required: "Name is required" })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  {...register("description")}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stage
                </label>
                <select
                  {...register("stage")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="exploring">Exploring</option>
                  <option value="validating">Validating</option>
                  <option value="building">Building</option>
                  <option value="live">Live</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateBoardMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
                >
                  {updateBoardMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
