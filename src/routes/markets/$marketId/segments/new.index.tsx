import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { ArrowLeft, Target } from "lucide-react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/markets/$marketId/segments/new/")({
  component: NewSegmentPage,
});

const segmentSchema = z.object({
  name: z.string().min(1, "Segment name is required"),
  characteristics: z.string().min(10, "Characteristics must be at least 10 characters"),
  size: z.string().optional(),
  growth: z.string().optional(),
});

type SegmentForm = z.infer<typeof segmentSchema>;

function NewSegmentPage() {
  const { marketId } = Route.useParams();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SegmentForm>({
    resolver: zodResolver(segmentSchema),
  });

  const createSegmentMutation = useMutation(
    trpc.createSegment.mutationOptions({
      onSuccess: () => {
        toast.success("Segment created successfully!");
        navigate({ to: `/markets/${marketId}` });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onSubmit = (data: SegmentForm) => {
    if (!token) {
      toast.error("You must be logged in to create a segment");
      navigate({ to: "/auth/login" });
      return;
    }
    
    createSegmentMutation.mutate({
      token,
      marketId: parseInt(marketId),
      name: data.name,
      characteristics: data.characteristics,
      size: data.size ? parseInt(data.size) : undefined,
      growth: data.growth ? parseFloat(data.growth) : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={() => navigate({ to: `/markets/${marketId}` })}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 rounded-lg p-2">
                <Target className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Create New Segment
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              New Market Segment
            </h1>
            <p className="text-gray-600">
              Define a specific segment within this market to explore opportunities
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Segment Name
              </label>
              <input
                id="name"
                type="text"
                {...register("name")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g., Small Business SaaS"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="characteristics"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Characteristics
              </label>
              <textarea
                id="characteristics"
                {...register("characteristics")}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Describe the key characteristics, customer needs, pain points, and defining features of this segment..."
              />
              {errors.characteristics && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.characteristics.message}
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="size"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Market Size (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    id="size"
                    type="number"
                    {...register("size")}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                    M
                  </span>
                </div>
                {errors.size && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.size.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Estimated market size in millions
                </p>
              </div>

              <div>
                <label
                  htmlFor="growth"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Growth Rate (Optional)
                </label>
                <div className="relative">
                  <input
                    id="growth"
                    type="number"
                    step="0.1"
                    {...register("growth")}
                    className="w-full pr-8 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="0.0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                    %
                  </span>
                </div>
                {errors.growth && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.growth.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Annual growth rate percentage
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={createSegmentMutation.isPending}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
              >
                {createSegmentMutation.isPending
                  ? "Creating..."
                  : "Create Segment"}
              </button>
              <button
                type="button"
                onClick={() => navigate({ to: `/markets/${marketId}` })}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
