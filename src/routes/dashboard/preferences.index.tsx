import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Waves, ArrowLeft, Save, User, Zap, Users, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/dashboard/preferences/")({
  component: PreferencesPage,
});

function PreferencesPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { token, isAuthenticated } = useAuthStore();
  
  const [values, setValues] = useState<string[]>([]);
  const [energyLevel, setEnergyLevel] = useState<"high" | "balanced" | "low">("balanced");
  const [workStyle, setWorkStyle] = useState<"solo" | "collaborative" | "hybrid">("collaborative");
  const [riskTolerance, setRiskTolerance] = useState<"low" | "medium" | "high">("medium");
  const [customValue, setCustomValue] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/auth/login" });
    }
  }, [isAuthenticated, navigate]);

  const preferencesQuery = useQuery(
    trpc.getUserPreferences.queryOptions({
      token: token || "",
    }),
  );

  useEffect(() => {
    if (preferencesQuery.data) {
      setValues(preferencesQuery.data.values);
      setEnergyLevel(preferencesQuery.data.energyLevel as any);
      setWorkStyle(preferencesQuery.data.workStyle as any);
      setRiskTolerance(preferencesQuery.data.riskTolerance as any);
    }
  }, [preferencesQuery.data]);

  const updateMutation = useMutation(
    trpc.updateUserPreferences.mutationOptions({
      onSuccess: () => {
        toast.success("Preferences saved!");
        preferencesQuery.refetch();
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to save preferences");
      },
    }),
  );

  const handleSave = () => {
    updateMutation.mutate({
      token: token || "",
      values,
      energyLevel,
      workStyle,
      riskTolerance,
    });
  };

  const addValue = () => {
    if (customValue.trim() && !values.includes(customValue.trim())) {
      setValues([...values, customValue.trim()]);
      setCustomValue("");
    }
  };

  const removeValue = (value: string) => {
    setValues(values.filter(v => v !== value));
  };

  const suggestedValues = [
    "innovation", "impact", "growth", "sustainability", "creativity",
    "efficiency", "quality", "collaboration", "independence", "learning",
    "leadership", "stability", "flexibility", "authenticity", "excellence"
  ];

  if (preferencesQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 rounded-lg p-2">
                <User className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Your Preferences
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Personalize Your Experience
            </h2>
            <p className="text-gray-600">
              These preferences help our AI provide better opportunity recommendations through "vibe checks" that assess alignment with your values and working style.
            </p>
          </div>

          <div className="space-y-8">
            {/* Values */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">Your Core Values</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                What matters most to you in your work? Select or add values that guide your decisions.
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {values.map((value) => (
                  <span
                    key={value}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
                  >
                    {value}
                    <button
                      onClick={() => removeValue(value)}
                      className="hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addValue()}
                  placeholder="Add a custom value..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={addValue}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <p className="text-xs text-gray-500 w-full mb-1">Suggestions:</p>
                {suggestedValues
                  .filter(v => !values.includes(v))
                  .slice(0, 8)
                  .map((value) => (
                    <button
                      key={value}
                      onClick={() => setValues([...values, value])}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                    >
                      + {value}
                    </button>
                  ))}
              </div>
            </div>

            {/* Energy Level */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-yellow-600" />
                <h3 className="text-lg font-bold text-gray-900">Energy Level</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                How much energy do you typically have for new initiatives?
              </p>
              
              <div className="grid grid-cols-3 gap-4">
                {(["low", "balanced", "high"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setEnergyLevel(level)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      energyLevel === level
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-semibold text-gray-900 capitalize mb-1">{level}</p>
                    <p className="text-xs text-gray-600">
                      {level === "low" && "Prefer steady, manageable projects"}
                      {level === "balanced" && "Mix of ambitious and sustainable"}
                      {level === "high" && "Ready for intense, demanding work"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Work Style */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900">Work Style</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                How do you prefer to work on projects?
              </p>
              
              <div className="grid grid-cols-3 gap-4">
                {(["solo", "collaborative", "hybrid"] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setWorkStyle(style)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      workStyle === style
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-semibold text-gray-900 capitalize mb-1">{style}</p>
                    <p className="text-xs text-gray-600">
                      {style === "solo" && "Independent, self-directed work"}
                      {style === "collaborative" && "Team-oriented, group projects"}
                      {style === "hybrid" && "Mix of solo and team work"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Risk Tolerance */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-bold text-gray-900">Risk Tolerance</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                How comfortable are you with uncertain outcomes?
              </p>
              
              <div className="grid grid-cols-3 gap-4">
                {(["low", "medium", "high"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setRiskTolerance(level)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      riskTolerance === level
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-semibold text-gray-900 capitalize mb-1">{level}</p>
                    <p className="text-xs text-gray-600">
                      {level === "low" && "Prefer proven, stable opportunities"}
                      {level === "medium" && "Calculated risks with good data"}
                      {level === "high" && "Comfortable with uncertainty"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 flex justify-end gap-4">
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending || values.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
