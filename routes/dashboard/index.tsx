import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { useTRPC } from "~/trpc/react";
import { useQuery } from "@tanstack/react-query";
import {
  Waves,
  Plus,
  TrendingUp,
  Target,
  BarChart3,
  Briefcase,
  Layers,
  Radio,
  MessageCircle,
  Crown,
} from "lucide-react";
import { useEffect } from "react";
import { AppNav } from "~/components/AppNav";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { user, token, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/auth/login" });
    }
  }, [isAuthenticated, navigate]);

  const marketsQuery = useQuery(
    trpc.getMarkets.queryOptions({
      token: token || "",
    }),
  );

  const subscriptionQuery = useQuery(
    trpc.getUserSubscription.queryOptions({
      token: token || "",
    }),
  );

  const creditBalanceQuery = useQuery(
    trpc.getCreditBalance.queryOptions({
      token: token || "",
      includeTransactions: false,
    }),
  );

  const subscription = subscriptionQuery.data;
  const creditBalance = creditBalanceQuery.data;

  const markets = marketsQuery.data || [];
  const totalOpportunities = markets.reduce((sum, market) => {
    return sum + (market._count?.segments || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav currentPage="dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-gray-600">
            Explore your market opportunities and discover blue oceans
          </p>
        </div>

        {/* Subscription & Credits Overview */}
        {subscription && (
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white mb-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5" />
                  <span className="text-sm font-medium text-purple-100">
                    Current Plan
                  </span>
                </div>
                <h2 className="text-2xl font-bold mb-1">
                  {subscription.tier.name}
                </h2>
                <p className="text-purple-100 text-sm">
                  {subscription.tier.creditsPerMonth} credits per month
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center px-6 py-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <div className="text-3xl font-bold">
                    {creditBalance?.balance || 0}
                  </div>
                  <div className="text-xs text-purple-100">
                    Credits Available
                  </div>
                </div>
                <button
                  onClick={() => navigate({ to: "/pricing" })}
                  className="px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
                >
                  Upgrade
                </button>
              </div>
            </div>
          </div>
        )}

        {!subscription && (
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Start Your Free Trial
                </h2>
                <p className="text-blue-100">
                  Get 10 free credits to explore Blue Ocean opportunities
                </p>
              </div>
              <button
                onClick={() => navigate({ to: "/pricing" })}
                className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                View Plans
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 rounded-lg p-3">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {markets.length}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">
              Active Markets
            </h3>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-lg p-3">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {totalOpportunities}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">
              Market Segments
            </h3>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 rounded-lg p-3">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {markets.reduce(
                  (sum, m) => sum + (m._count?.competitors || 0),
                  0,
                )}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Competitors</h3>
          </div>
        </div>

        {/* Quick Access */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => navigate({ to: "/boards" })}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-left hover:shadow-lg transition-all group"
          >
            <Layers className="w-8 h-8 text-white mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">
              Opportunity Boards
            </h3>
            <p className="text-blue-100 text-sm">
              Organize opportunities through stages: exploring, validating, building, live
            </p>
          </button>

          <button
            onClick={() => navigate({ to: "/radars" })}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-left hover:shadow-lg transition-all group"
          >
            <Radio className="w-8 h-8 text-white mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">
              Trend Radars
            </h3>
            <p className="text-purple-100 text-sm">
              Set up continuous monitoring for opportunities matching your criteria
            </p>
          </button>

          <button
            onClick={() => navigate({ to: "/strategy" })}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-left hover:shadow-lg transition-all group"
          >
            <MessageCircle className="w-8 h-8 text-white mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">
              AI Strategy Assistant
            </h3>
            <p className="text-green-100 text-sm">
              Get personalized guidance and validate your opportunities with AI
            </p>
          </button>
        </div>

        {/* Markets Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Your Markets</h2>
            <button
              onClick={() => navigate({ to: "/markets/new" })}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Market
            </button>
          </div>

          {marketsQuery.isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading markets...</p>
            </div>
          ) : markets.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 rounded-full p-6 w-fit mx-auto mb-4">
                <Briefcase className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No markets yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first market project to start exploring
                opportunities
              </p>
              <button
                onClick={() => navigate({ to: "/markets/new" })}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Market
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {markets.map((market) => (
                <div
                  key={market.id}
                  onClick={() =>
                    navigate({ to: `/markets/${market.id}` })
                  }
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-blue-100 rounded-lg p-3 group-hover:bg-blue-600 transition-colors">
                      <TrendingUp className="w-6 h-6 text-blue-600 group-hover:text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {market.sector}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {market.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {market.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{market._count?.segments || 0} segments</span>
                    <span>•</span>
                    <span>{market._count?.competitors || 0} competitors</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
