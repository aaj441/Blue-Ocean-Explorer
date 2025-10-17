import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Waves,
  Plus,
  Layers,
  LogOut,
  Settings,
  Trash2,
  Edit,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog } from "@headlessui/react";
import toast from "react-hot-toast";
import { AppNav } from "~/components/AppNav";

export const Route = createFileRoute("/boards/")({
  component: BoardsPage,
});

interface CreateBoardForm {
  name: string;
  description: string;
  stage: "exploring" | "validating" | "building" | "live";
}

function BoardsPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { user, token, clearAuth, isAuthenticated } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/auth/login" });
    }
  }, [isAuthenticated, navigate]);

  const boardsQuery = useQuery(
    trpc.getBoards.queryOptions({
      token: token || "",
    }),
  );

  const createBoardMutation = useMutation(
    trpc.createBoard.mutationOptions({
      onSuccess: () => {
        toast.success("Board created successfully!");
        setIsCreateModalOpen(false);
        boardsQuery.refetch();
        reset();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create board");
      },
    }),
  );

  const deleteBoardMutation = useMutation(
    trpc.deleteBoard.mutationOptions({
      onSuccess: () => {
        toast.success("Board deleted");
        boardsQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete board");
      },
    }),
  );

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateBoardForm>();

  const onSubmit = (data: CreateBoardForm) => {
    createBoardMutation.mutate({
      token: token || "",
      ...data,
    });
  };

  const handleLogout = () => {
    clearAuth();
    navigate({ to: "/" });
  };

  const handleDeleteBoard = (boardId: number) => {
    if (confirm("Are you sure you want to delete this board?")) {
      deleteBoardMutation.mutate({
        token: token || "",
        boardId,
      });
    }
  };

  const boards = boardsQuery.data || [];

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

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav currentPage="boards" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Opportunity Boards
              </h1>
              <p className="text-gray-600">
                Organize and track your opportunities through stages
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Board
            </button>
          </div>
        </div>

        {/* Boards Grid */}
        {boardsQuery.isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading boards...</p>
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="bg-gray-100 rounded-full p-6 w-fit mx-auto mb-4">
              <Layers className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No boards yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first board to start organizing opportunities
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Board
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <div
                key={board.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => navigate({ to: `/boards/${board.id}` })}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-blue-100 rounded-lg p-3 group-hover:bg-blue-600 transition-colors">
                    <Layers className="w-6 h-6 text-blue-600 group-hover:text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${stageColors[board.stage as keyof typeof stageColors]}`}
                    >
                      {stageLabels[board.stage as keyof typeof stageLabels]}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBoard(board.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete board"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {board.name}
                </h3>
                {board.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {board.description}
                  </p>
                )}
                <div className="flex items-center text-sm text-gray-500">
                  <span>{board._count?.opportunities || 0} opportunities</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Board Modal */}
      <Dialog
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl p-6 max-w-md w-full">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
              Create New Board
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
                  placeholder="Q4 2025 Focus"
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
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Opportunities I'm actively exploring this quarter"
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
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBoardMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
                >
                  {createBoardMutation.isPending ? "Creating..." : "Create Board"}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
