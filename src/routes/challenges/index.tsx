import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { useTRPC } from "~/trpc/react";
import { useQuery } from "@tanstack/react-query";
import { AppNav } from "~/components/AppNav";
import { Trophy, Target, Clock, Users, Award, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/challenges/")({
  component: ChallengesPage,
});

function ChallengesPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { token, isAuthenticated } = useAuthStore();
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/auth/login" });
    }
  }, [isAuthenticated, navigate]);

  const challengesQuery = useQuery(
    trpc.getChallenges.queryOptions({
      token: token || "",
      status: selectedStatus ? selectedStatus as any : undefined,
      challengeType: selectedType ? selectedType as any : undefined,
    }),
  );

  const badgesQuery = useQuery(
    trpc.getBadges.queryOptions({
      token: token || "",
    }),
  );

  const challenges = challengesQuery.data || [];
  const userBadges = badgesQuery.data?.userBadges || [];

  const statusColors = {
    active: "bg-green-100 text-green-700",
    judging: "bg-yellow-100 text-yellow-700",
    completed: "bg-gray-100 text-gray-700",
  };

  const typeLabels = {
    blue_ocean_scenario: "Blue Ocean Scenario",
    market_discovery: "Market Discovery",
    value_innovation: "Value Innovation",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav currentPage="challenges" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Challenge Arena
          </h1>
          <p className="text-gray-600">
            Compete in blue ocean strategy challenges and earn badges
          </p>
        </div>

        {/* User Badges Section */}
        {userBadges.length > 0 && (
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold mb-1">Your Badges</h2>
                <p className="text-purple-100 text-sm">
                  {userBadges.length} badge{userBadges.length !== 1 ? "s" : ""} earned
                </p>
              </div>
              <Award className="w-8 h-8 text-purple-200" />
            </div>
            <div className="flex flex-wrap gap-3">
              {userBadges.slice(0, 6).map((ub) => (
                <div
                  key={ub.id}
                  className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2"
                  title={ub.badge.description}
                >
                  <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{ub.badge.name}</p>
                    <p className="text-xs text-purple-100 capitalize">
                      {ub.badge.rarity}
                    </p>
                  </div>
                </div>
              ))}
              {userBadges.length > 6 && (
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex items-center justify-center min-w-[80px]">
                  <p className="text-sm font-semibold">
                    +{userBadges.length - 6} more
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="judging">Judging</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Challenge Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="blue_ocean_scenario">Blue Ocean Scenario</option>
                <option value="market_discovery">Market Discovery</option>
                <option value="value_innovation">Value Innovation</option>
              </select>
            </div>
          </div>
        </div>

        {/* Challenges Grid */}
        {challengesQuery.isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading challenges...</p>
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="bg-gray-100 rounded-full p-6 w-fit mx-auto mb-4">
              <Trophy className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No challenges found
            </h3>
            <p className="text-gray-600">
              Check back later for new challenges
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => {
              const isActive = challenge.status === "active";
              const hasSubmitted = !!challenge.userSubmissionId;
              const daysLeft = Math.ceil(
                (new Date(challenge.endDate).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={challenge.id}
                  onClick={() => navigate({ to: `/challenges/${challenge.id}` })}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`rounded-lg p-3 ${isActive ? "bg-green-100" : "bg-gray-100"}`}>
                      <Target className={`w-6 h-6 ${isActive ? "text-green-600" : "text-gray-400"}`} />
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${statusColors[challenge.status as keyof typeof statusColors]}`}
                    >
                      {challenge.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {challenge.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {challenge.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold text-yellow-600">
                        {challenge.prize} credits
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      <span>{challenge.participantCount} participants</span>
                    </div>
                    {isActive && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>
                          {daysLeft > 0 ? `${daysLeft} days left` : "Ending soon"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {typeLabels[challenge.challengeType as keyof typeof typeLabels]}
                    </span>
                    {hasSubmitted && (
                      <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                        Submitted
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
