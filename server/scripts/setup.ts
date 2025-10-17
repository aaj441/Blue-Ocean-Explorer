import { db } from "~/server/db";

async function setup() {
  // Seed subscription tiers
  await seedSubscriptionTiers();
}

async function seedSubscriptionTiers() {
  const existingTiers = await db.subscriptionTier.count();
  
  if (existingTiers > 0) {
    console.log("Subscription tiers already exist, skipping seed");
    return;
  }

  console.log("Seeding subscription tiers...");

  await db.subscriptionTier.createMany({
    data: [
      {
        name: "Free",
        description: "Perfect for exploring Blue Ocean opportunities",
        price: 0,
        features: JSON.stringify([
          "basic_scenario_analysis",
          "opportunity_boards",
          "market_analysis",
        ]),
        creditsPerMonth: 10,
        maxScenarios: 5,
        maxRadars: 2,
        maxBoards: 3,
        isActive: true,
      },
      {
        name: "Pro",
        description: "For serious strategists and growing teams",
        price: 49,
        features: JSON.stringify([
          "basic_scenario_analysis",
          "advanced_scenario_analysis",
          "scenario_comparison",
          "ai_insights",
          "export_pdf",
          "opportunity_boards",
          "market_analysis",
          "trend_radar",
          "collaboration",
        ]),
        creditsPerMonth: 100,
        maxScenarios: 50,
        maxRadars: 10,
        maxBoards: 20,
        isActive: true,
      },
      {
        name: "Enterprise",
        description: "Unlimited power for organizations",
        price: 199,
        features: JSON.stringify([
          "basic_scenario_analysis",
          "advanced_scenario_analysis",
          "scenario_comparison",
          "ai_insights",
          "export_pdf",
          "opportunity_boards",
          "market_analysis",
          "trend_radar",
          "collaboration",
          "api_access",
          "custom_branding",
          "priority_support",
          "team_management",
          "advanced_analytics",
        ]),
        creditsPerMonth: 500,
        maxScenarios: null, // unlimited
        maxRadars: null,
        maxBoards: null,
        isActive: true,
      },
    ],
  });

  console.log("Subscription tiers seeded successfully");
}

setup()
  .then(() => {
    console.log("setup.ts complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
