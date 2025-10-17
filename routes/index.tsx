import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import {
  Waves,
  TrendingUp,
  Target,
  BarChart3,
  Users,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, navigate]);

  const features = [
    {
      icon: Target,
      title: "Market Discovery",
      description:
        "Identify untapped market segments and underserved customer needs with AI-powered analysis",
      color: "bg-blue-500",
    },
    {
      icon: BarChart3,
      title: "Competitive Analysis",
      description:
        "Benchmark against competitors and discover strategic positioning opportunities",
      color: "bg-purple-500",
    },
    {
      icon: TrendingUp,
      title: "Opportunity Scoring",
      description:
        "Prioritize opportunities with customizable scoring based on revenue potential and strategic fit",
      color: "bg-green-500",
    },
    {
      icon: Lightbulb,
      title: "Trend Tracking",
      description:
        "Monitor market trends and sentiment in real-time to stay ahead of the curve",
      color: "bg-yellow-500",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description:
        "Work together with annotations, comments, and shared reports",
      color: "bg-pink-500",
    },
    {
      icon: Waves,
      title: "Blue Ocean Strategy",
      description:
        "Apply proven frameworks to create uncontested market space and make competition irrelevant",
      color: "bg-indigo-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 rounded-lg p-2">
                <Waves className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Blue Ocean Explorer
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate({ to: "/auth/login" })}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate({ to: "/auth/register" })}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Discover Your
                <span className="text-blue-600"> Blue Ocean</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Navigate beyond competition. Identify untapped market
                opportunities, analyze trends, and create uncontested market
                space with data-driven insights.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate({ to: "/auth/register" })}
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg transition-colors flex items-center gap-2"
                >
                  Start Exploring
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate({ to: "/auth/login" })}
                  className="px-8 py-4 bg-white text-gray-700 rounded-lg hover:bg-gray-50 font-semibold text-lg border-2 border-gray-200 transition-colors"
                >
                  Sign In
                </button>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=800&auto=format&fit=crop"
                alt="Market Analysis Dashboard"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-6 max-w-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-green-100 rounded-lg p-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="font-semibold text-gray-900">
                    23 Opportunities
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Identified in untapped markets
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Navigate Blue Oceans
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools to discover, analyze, and prioritize market
              opportunities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow"
              >
                <div
                  className={`${feature.color} rounded-lg p-3 w-fit mb-4`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Explore Untapped Markets?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join strategists and innovators who are creating uncontested market
            space
          </p>
          <button
            onClick={() => navigate({ to: "/auth/register" })}
            className="px-10 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-50 font-bold text-lg transition-colors inline-flex items-center gap-2"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-blue-600 rounded-lg p-2">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              Blue Ocean Explorer
            </span>
          </div>
          <p>© 2024 Blue Ocean Explorer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
