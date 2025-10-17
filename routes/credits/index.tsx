import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Coins, Plus, TrendingUp, TrendingDown, History } from "lucide-react";
import { AppNav } from "~/components/AppNav";
import toast from "react-hot-toast";

export const Route = createFileRoute("/credits/")({
  component: CreditsPage,
});

function CreditsPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { token, isAuthenticated } = useAuthStore();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/auth/login" });
    }
  }, [isAuthenticated, navigate]);

  const balanceQuery = useQuery(
    trpc.getCreditBalance.queryOptions({
      token: token || "",
      includeTransactions: true,
    }),
  );

  const subscriptionQuery = useQuery(
    trpc.getUserSubscription.queryOptions({
      token: token || "",
    }),
  );

  const createPaymentMutation = useMutation(
    trpc.createPaymentIntent.mutationOptions({
      onSuccess: (data) => {
        toast.success("Payment initiated! (Mock mode)");
        // In real implementation, redirect to Stripe checkout
        console.log("Payment intent created:", data);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const creditPackages = [
    { credits: 50, price: 45, bonus: 0 },
    { credits: 100, price: 85, bonus: 10 },
    { credits: 250, price: 200, bonus: 50 },
    { credits: 500, price: 375, bonus: 125 },
  ];

  const handlePurchase = (pkg: { credits: number; price: number }) => {
    createPaymentMutation.mutate({
      token: token || "",
      amount: pkg.price,
      type: "credits",
      metadata: {
        credits: pkg.credits.toString(),
      },
    });
  };

  const balance = balanceQuery.data;
  const subscription = subscriptionQuery.data;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav currentPage="credits" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Credit Management
          </h1>
          <p className="text-gray-600">
            Purchase credits to power AI-driven insights and analysis
          </p>
        </div>

        {/* Balance Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 rounded-lg p-3">
                <Coins className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {balance?.balance || 0}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">
              Available Credits
            </h3>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-lg p-3">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {balance?.lifetimeEarned || 0}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">
              Lifetime Earned
            </h3>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 rounded-lg p-3">
                <TrendingDown className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {balance?.lifetimeSpent || 0}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">
              Lifetime Spent
            </h3>
          </div>
        </div>

        {/* Subscription Info */}
        {subscription && (
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  {subscription.tier.name} Plan
                </h3>
                <p className="text-purple-100">
                  You receive {subscription.tier.creditsPerMonth} credits every
                  month
                </p>
              </div>
              <button
                onClick={() => navigate({ to: "/pricing" })}
                className="px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        )}

        {/* Purchase Packages */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Purchase Credit Packages
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {creditPackages.map((pkg) => (
              <div
                key={pkg.credits}
                className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                  selectedPackage === pkg.credits
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
                onClick={() => setSelectedPackage(pkg.credits)}
              >
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {pkg.credits}
                  </div>
                  <div className="text-sm text-gray-600">credits</div>
                  {pkg.bonus > 0 && (
                    <div className="text-xs font-semibold text-green-600 mt-1">
                      +{pkg.bonus} bonus
                    </div>
                  )}
                </div>
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-gray-900">
                    ${pkg.price}
                  </div>
                  <div className="text-xs text-gray-500">
                    ${(pkg.price / pkg.credits).toFixed(2)}/credit
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePurchase(pkg);
                  }}
                  disabled={createPaymentMutation.isPending}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createPaymentMutation.isPending ? "Processing..." : "Buy Now"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex items-center gap-2 mb-6">
            <History className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Transaction History
            </h2>
          </div>

          {balanceQuery.isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : balance?.transactions && balance.transactions.length > 0 ? (
            <div className="space-y-3">
              {balance.transactions.map((tx: any) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {tx.description}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      tx.amount > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No transactions yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
