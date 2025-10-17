import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppNav } from "~/components/AppNav";
import {
  ArrowLeft,
  Trophy,
  Users,
  Clock,
  Star,
  Send,
  ThumbsUp,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog } from "@headlessui/react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/challenges/$challengeId/")({
  component: ChallengeDetailPage,
});

function ChallengeDetailPage() {
  const { challengeId } = Route.useParams();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<number | null>(null);

  const challengeQuery = useQuery(
    trpc.getChallengeDetails.queryOptions({
      token: token || "",
      challengeId: parseInt(challengeId),
    }),
  );

  const submitMutation = useMutation(
    trpc.submitChallenge.mutationOptions({
      onSuccess: () => {
        toast.success("Submission successful!");
        setShowSubmitModal(false);
        challengeQuery.refetch();
        reset();
      },
      onError: (error: any) => {
        toast.error(error.message || "Submission failed");
      },
    }),
  );

  const voteMutation = useMutation(
    trpc.voteOnSubmission.mutationOptions({
      onSuccess: () => {
        toast.success("Vote submitted!");
        setSelectedSubmission(null);
        challengeQuery.refetch();
      },
      onError: (error: any) => {
        toast.error(error.message || "Vote failed");
      },
    }),
  );

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    title: string;
    description: string;
    content: string;
  }>();

  const onSubmit = (data: { title: string; description: string; content: string }) => {
    submitMutation.mutate({
      token: token || "",
      challengeId: parseInt(challengeId),
      title: data.title,
      description: data.description,
      content: { details: data.content },
    });
  };

  const handleVote = (submissionId: number, score: number) => {
    voteMutation.mutate({
      token: token || "",
      submissionId,
      score,
    });
  };

  const challenge = challengeQuery.data?.challenge;
  const userSubmission = challengeQuery.data?.userSubmission;
  const userVotes = challengeQuery.data?.userVotes;

  if (challengeQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading challenge...</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppNav currentPage="challenges" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Challenge Not Found
            </h2>
            <button
              onClick={() => navigate({ to: "/challenges" })}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to Challenges
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isActive = challenge.status === "active";
  const canSubmit = isActive && !userSubmission;
  const daysLeft = Math.ceil(
    (new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav currentPage="challenges" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate({ to: "/challenges" })}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Challenges
        </button>

        {/* Challenge Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className={`text-xs font-medium px-2 py-1 rounded ${
                isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
              }`}>
                {challenge.status}
              </span>
              <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {challenge.challengeType.replace(/_/g, " ")}
              </span>
            </div>
            {canSubmit && (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Submit Entry
              </button>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {challenge.title}
          </h1>

          <p className="text-gray-600 leading-relaxed mb-6">
            {challenge.description}
          </p>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 rounded-lg p-3">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Prize</p>
                <p className="font-bold text-gray-900">{challenge.prize} credits</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-lg p-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Participants</p>
                <p className="font-bold text-gray-900">{challenge.participantCount}</p>
              </div>
            </div>

            {isActive && (
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 rounded-lg p-3">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time Left</p>
                  <p className="font-bold text-gray-900">
                    {daysLeft > 0 ? `${daysLeft} days` : "Ending soon"}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-lg p-3">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Submissions</p>
                <p className="font-bold text-gray-900">{challenge.submissions.length}</p>
              </div>
            </div>
          </div>

          {userSubmission && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-700 mb-1">
                You have submitted an entry
              </p>
              <p className="text-sm text-green-600">
                Votes: {userSubmission.voteCount} | Score: {userSubmission.peerScore?.toFixed(1) || "N/A"}
              </p>
            </div>
          )}
        </div>

        {/* Submissions Leaderboard */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Submissions</h2>

          {challenge.submissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No submissions yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {challenge.submissions.map((submission, index) => {
                const hasVoted = userVotes?.has(submission.id);
                const userVoteScore = userVotes?.get(submission.id);

                return (
                  <div
                    key={submission.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? "bg-yellow-100 text-yellow-700" :
                          index === 1 ? "bg-gray-200 text-gray-700" :
                          index === 2 ? "bg-orange-100 text-orange-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          #{index + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{submission.title}</h3>
                          <p className="text-sm text-gray-500">by {submission.user.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-lg font-bold text-blue-600">
                          <ThumbsUp className="w-5 h-5" />
                          {submission.voteCount}
                        </div>
                        {submission.peerScore && (
                          <p className="text-sm text-gray-500">
                            Score: {submission.peerScore.toFixed(1)}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                      {submission.description}
                    </p>

                    {!hasVoted && submission.user.id !== userSubmission?.userId && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedSubmission(submission.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                        >
                          Vote
                        </button>
                      </div>
                    )}

                    {hasVoted && (
                      <p className="text-sm text-green-600">
                        You voted: {userVoteScore} stars
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Submit Entry Modal */}
      <Dialog
        open={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl p-6 max-w-md w-full">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
              Submit Your Entry
            </Dialog.Title>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  {...register("title", { required: "Title is required" })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="My Blue Ocean Strategy"
                />
                {errors.title && (
                  <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  {...register("description", { required: "Description is required" })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief overview of your approach..."
                />
                {errors.description && (
                  <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detailed Submission
                </label>
                <textarea
                  {...register("content", { required: "Content is required" })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Detailed explanation of your strategy..."
                />
                {errors.content && (
                  <p className="text-red-600 text-sm mt-1">{errors.content.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Vote Modal */}
      {selectedSubmission && (
        <Dialog
          open={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-white rounded-xl p-6 max-w-sm w-full">
              <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
                Vote on Submission
              </Dialog.Title>
              <p className="text-gray-600 mb-6">
                Rate this submission from 1 to 5 stars
              </p>
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    onClick={() => handleVote(selectedSubmission, score)}
                    disabled={voteMutation.isPending}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Star className="w-8 h-8 text-yellow-500 hover:fill-yellow-500" />
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </div>
  );
}
