import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppNav } from "~/components/AppNav";
import {
  ArrowLeft,
  Star,
  ShoppingCart,
  DollarSign,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

export const Route = createFileRoute("/marketplace/$listingId/")({
  component: ListingDetailPage,
});

function ListingDetailPage() {
  const { listingId } = Route.useParams();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const listingQuery = useQuery(
    trpc.getMarketplaceListingDetails.queryOptions({
      token: token || "",
      listingId: parseInt(listingId),
    }),
  );

  const creditBalanceQuery = useQuery(
    trpc.getCreditBalance.queryOptions({
      token: token || "",
      includeTransactions: false,
    }),
  );

  const purchaseMutation = useMutation(
    trpc.purchaseMarketplaceListing.mutationOptions({
      onSuccess: () => {
        toast.success("Purchase successful!");
        listingQuery.refetch();
        creditBalanceQuery.refetch();
      },
      onError: (error: any) => {
        toast.error(error.message || "Purchase failed");
      },
    }),
  );

  const reviewMutation = useMutation(
    trpc.createMarketplaceReview.mutationOptions({
      onSuccess: () => {
        toast.success("Review submitted!");
        setShowReviewForm(false);
        listingQuery.refetch();
        reset();
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to submit review");
      },
    }),
  );

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    rating: number;
    comment: string;
  }>();

  const onSubmitReview = (data: { rating: number; comment: string }) => {
    reviewMutation.mutate({
      token: token || "",
      listingId: parseInt(listingId),
      rating: data.rating,
      comment: data.comment || undefined,
    });
  };

  const handlePurchase = () => {
    if (confirm("Are you sure you want to purchase this item?")) {
      purchaseMutation.mutate({
        token: token || "",
        listingId: parseInt(listingId),
      });
    }
  };

  const listing = listingQuery.data?.listing;
  const hasPurchased = listingQuery.data?.hasPurchased;
  const creditBalance = creditBalanceQuery.data?.balance || 0;
  const priceInCredits = listing ? Math.ceil(listing.price * 10) : 0;
  const canAfford = creditBalance >= priceInCredits;

  if (listingQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppNav currentPage="marketplace" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Listing Not Found
            </h2>
            <button
              onClick={() => navigate({ to: "/marketplace" })}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tags = listing.tags ? JSON.parse(listing.tags) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav currentPage="marketplace" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate({ to: "/marketplace" })}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Marketplace
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {listing.type.replace(/_/g, " ")}
                  </span>
                  {listing.category && (
                    <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {listing.category}
                    </span>
                  )}
                </div>
                {listing.averageRating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-lg font-bold text-gray-900">
                      {listing.averageRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({listing._count.reviews} reviews)
                    </span>
                  </div>
                )}
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {listing.title}
              </h1>

              <p className="text-gray-600 leading-relaxed mb-6">
                {listing.description}
              </p>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {tags.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">Seller</p>
                  <p className="font-semibold text-gray-900">
                    {listing.seller.name}
                  </p>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
                <div>
                  <p className="text-sm text-gray-500">Total Sales</p>
                  <p className="font-semibold text-gray-900">
                    {listing.totalSales}
                  </p>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
                {hasPurchased && !showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Write a Review
                  </button>
                )}
              </div>

              {showReviewForm && (
                <form onSubmit={handleSubmit(onSubmitReview)} className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating
                    </label>
                    <select
                      {...register("rating", { required: "Rating is required", valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select rating</option>
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Good</option>
                      <option value="3">3 - Average</option>
                      <option value="2">2 - Below Average</option>
                      <option value="1">1 - Poor</option>
                    </select>
                    {errors.rating && (
                      <p className="text-red-600 text-sm mt-1">{errors.rating.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comment (optional)
                    </label>
                    <textarea
                      {...register("comment")}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Share your experience..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={reviewMutation.isPending}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                    >
                      {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                </form>
              )}

              {listing.reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {listing.reviews.map((review) => (
                    <div key={review.id} className="pb-4 border-b border-gray-200 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {review.user.name}
                          </p>
                          {review.isVerifiedPurchase && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-600">{review.comment}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-1">Price</p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-3xl font-bold text-blue-600">
                    <DollarSign className="w-6 h-6" />
                    {listing.price.toFixed(2)}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {priceInCredits} credits
                </p>
              </div>

              {hasPurchased ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                  <div className="flex items-center gap-2 text-green-700 font-semibold mb-1">
                    <CheckCircle className="w-5 h-5" />
                    Already Purchased
                  </div>
                  <p className="text-sm text-green-600">
                    You have access to this item
                  </p>
                </div>
              ) : (
                <>
                  <button
                    onClick={handlePurchase}
                    disabled={purchaseMutation.isPending || !canAfford}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {purchaseMutation.isPending ? "Processing..." : "Purchase Now"}
                  </button>

                  {!canAfford && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-700">
                        Insufficient credits. You need {priceInCredits} but have {creditBalance}.
                      </p>
                      <button
                        onClick={() => navigate({ to: "/credits" })}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
                      >
                        Purchase Credits →
                      </button>
                    </div>
                  )}
                </>
              )}

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Secure payment • 70% goes to creator
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
