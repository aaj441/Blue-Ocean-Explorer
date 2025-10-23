import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { useTRPC } from "~/trpc/react";
import { useQuery } from "@tanstack/react-query";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { AppNav } from "~/components/AppNav";

export const Route = createFileRoute("/pricing/")({
  component: PricingPage,
});

function PricingPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { isAuthenticated } = useAuthStore();

  const tiersQuery = useQuery(trpc.getSubscriptionTiers.queryOptions({}));
  const tiers = tiersQuery.data || [];

  const tierIcons = {
    Free: Sparkles,
    Pro: Zap,
    Enterprise: Crown,
  };

  const tierColors = {
    Free: "blue",
    Pro: "purple",
    Enterprise: "amber",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav currentPage="pricing" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Blue Ocean Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlock powerful tools to discover and validate untapped market
            opportunities
          </p>
        </div>

        {/* Pricing Cards */}
        {tiersQuery.isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading pricing options...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {tiers.map((tier) => {
              const Icon = tierIcons[tier.name as keyof typeof tierIcons];
              const color = tierColors[tier.name as keyof typeof tierColors];
              const isPopular = tier.name === "Pro";

              return (
                <div
                  key={tier.id}
                  className={`relative bg-white rounded-2xl border-2 p-8 ${
                    isPopular
                      ? "border-purple-500 shadow-xl scale-105"
                      : "border-gray-200"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 bg-${color}-100 rounded-xl mb-4`}
                    >
                      {Icon && <Icon className={`w-8 h-8 text-${color}-600`} />}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {tier.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {tier.description}
                    </p>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-bold text-gray-900">
                        ${tier.price}
                      </span>
                      <span className="text-gray-600">/month</span>
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="text-sm font-semibold text-gray-900 mb-3">
                      Includes:
                    </div>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">
                          {tier.creditsPerMonth} credits/month
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">
                          {tier.maxScenarios
                            ? `Up to ${tier.maxScenarios} scenarios`
                            : "Unlimited scenarios"}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">
                          {tier.maxRadars
                            ? `${tier.maxRadars} trend radars`
                            : "Unlimited trend radars"}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">
                          {tier.maxBoards
                            ? `${tier.maxBoards} opportunity boards`
                            : "Unlimited opportunity boards"}
                        </span>
                      </li>
                      {tier.features.slice(0, 4).map((feature: string) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-600">
                            {feature
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      if (!isAuthenticated()) {
                        navigate({ to: "/auth/register" });
                      } else {
                        // TODO: Navigate to checkout
                        alert("Checkout flow coming soon!");
                      }
                    }}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                      isPopular
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : tier.name === "Free"
                          ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
                          : "bg-amber-600 text-white hover:bg-amber-700"
                    }`}
                  >
                    {tier.price === 0
                      ? "Get Started Free"
                      : `Subscribe to ${tier.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* FAQ Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What are credits used for?
              </h3>
              <p className="text-sm text-gray-600">
                Credits power AI-driven features like scenario analysis, trend
                detection, and opportunity scoring. Each feature consumes a
                specific number of credits.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I change plans later?
              </h3>
              <p className="text-sm text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes
                take effect at the start of your next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Do unused credits roll over?
              </h3>
              <p className="text-sm text-gray-600">
                Monthly subscription credits don't roll over, but purchased
                credits never expire and can be used anytime.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-sm text-gray-600">
                Our Free plan gives you full access to core features. Upgrade
                anytime to unlock advanced capabilities and higher limits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
