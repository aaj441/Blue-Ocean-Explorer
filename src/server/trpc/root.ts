import {
  createCallerFactory,
  createTRPCRouter,
} from "~/server/trpc/main";
import { register } from "~/server/trpc/procedures/register";
import { login } from "~/server/trpc/procedures/login";
import { createMarket } from "~/server/trpc/procedures/createMarket";
import { getMarkets } from "~/server/trpc/procedures/getMarkets";
import { getMarketDetails } from "~/server/trpc/procedures/getMarketDetails";
import { createOpportunity } from "~/server/trpc/procedures/createOpportunity";
import { updateOpportunityScore } from "~/server/trpc/procedures/updateOpportunityScore";
import { getOpportunities } from "~/server/trpc/procedures/getOpportunities";
import { createCompetitor } from "~/server/trpc/procedures/createCompetitor";
import { createSegment } from "~/server/trpc/procedures/createSegment";
import { generateVibeCheck } from "~/server/trpc/procedures/generateVibeCheck";
import { generateOpportunityConnections } from "~/server/trpc/procedures/generateOpportunityConnections";
import { getOpportunityConnections } from "~/server/trpc/procedures/getOpportunityConnections";
import { createBreadcrumb } from "~/server/trpc/procedures/createBreadcrumb";
import { getUserPreferences } from "~/server/trpc/procedures/getUserPreferences";
import { updateUserPreferences } from "~/server/trpc/procedures/updateUserPreferences";
import { getBoards } from "~/server/trpc/procedures/getBoards";
import { createBoard } from "~/server/trpc/procedures/createBoard";
import { updateBoard } from "~/server/trpc/procedures/updateBoard";
import { deleteBoard } from "~/server/trpc/procedures/deleteBoard";
import { getBoardDetails } from "~/server/trpc/procedures/getBoardDetails";
import { addOpportunityToBoard } from "~/server/trpc/procedures/addOpportunityToBoard";
import { removeOpportunityFromBoard } from "~/server/trpc/procedures/removeOpportunityFromBoard";
import { getRadars } from "~/server/trpc/procedures/getRadars";
import { createRadar } from "~/server/trpc/procedures/createRadar";
import { updateRadar } from "~/server/trpc/procedures/updateRadar";
import { deleteRadar } from "~/server/trpc/procedures/deleteRadar";
import { getRadarMatches } from "~/server/trpc/procedures/getRadarMatches";
import { getStrategySessions } from "~/server/trpc/procedures/getStrategySessions";
import { createStrategySession } from "~/server/trpc/procedures/createStrategySession";
import { strategyChatStream } from "~/server/trpc/procedures/strategyChatStream";
import { deleteStrategySession } from "~/server/trpc/procedures/deleteStrategySession";
import { createScenario } from "~/server/trpc/procedures/createScenario";
import { getScenarios } from "~/server/trpc/procedures/getScenarios";
import { updateScenario } from "~/server/trpc/procedures/updateScenario";
import { deleteScenario } from "~/server/trpc/procedures/deleteScenario";
import { createPaymentIntent } from "~/server/trpc/procedures/createPaymentIntent";
import { getSubscriptionTiers } from "~/server/trpc/procedures/getSubscriptionTiers";
import { getUserSubscription } from "~/server/trpc/procedures/getUserSubscription";
import { getCreditBalance } from "~/server/trpc/procedures/getCreditBalance";
import { purchaseCredits } from "~/server/trpc/procedures/purchaseCredits";
import { checkFeatureAccess } from "~/server/trpc/procedures/checkFeatureAccess";
import { generateCrossIndustryScenarios } from "~/server/trpc/procedures/generateCrossIndustryScenarios";
import { createBlueOceanCanvas } from "~/server/trpc/procedures/createBlueOceanCanvas";
import { getBlueOceanCanvases } from "~/server/trpc/procedures/getBlueOceanCanvases";
import { updateBlueOceanCanvas } from "~/server/trpc/procedures/updateBlueOceanCanvas";
import { generateDynamicSegments } from "~/server/trpc/procedures/generateDynamicSegments";
import { analyzeTrendIntersections } from "~/server/trpc/procedures/analyzeTrendIntersections";
import { suggestPartnerships } from "~/server/trpc/procedures/suggestPartnerships";
import { generatePitchDeck } from "~/server/trpc/procedures/generatePitchDeck";
import { predictValueMigration } from "~/server/trpc/procedures/predictValueMigration";
import { getMarketplaceListings } from "~/server/trpc/procedures/getMarketplaceListings";
import { getMarketplaceListingDetails } from "~/server/trpc/procedures/getMarketplaceListingDetails";
import { createMarketplaceListing } from "~/server/trpc/procedures/createMarketplaceListing";
import { purchaseMarketplaceListing } from "~/server/trpc/procedures/purchaseMarketplaceListing";
import { createMarketplaceReview } from "~/server/trpc/procedures/createMarketplaceReview";
import { getChallenges } from "~/server/trpc/procedures/getChallenges";
import { getChallengeDetails } from "~/server/trpc/procedures/getChallengeDetails";
import { submitChallenge } from "~/server/trpc/procedures/submitChallenge";
import { voteOnSubmission } from "~/server/trpc/procedures/voteOnSubmission";
import { getBadges } from "~/server/trpc/procedures/getBadges";
import { getTrendIntersections } from "~/server/trpc/procedures/getTrendIntersections";
import { getValueMigrations } from "~/server/trpc/procedures/getValueMigrations";
import { getPartnerships } from "~/server/trpc/procedures/getPartnerships";
import { simulateScenario } from "~/server/trpc/procedures/simulateScenario";
import { remixBusinessModel } from "~/server/trpc/procedures/remixBusinessModel";
import { generateCuratedFeed } from "~/server/trpc/procedures/generateCuratedFeed";
import { generateMarketReport } from "~/server/trpc/procedures/generateMarketReport";
import { createProblem } from "~/server/trpc/procedures/createProblem";
import { submitProblemSolution } from "~/server/trpc/procedures/submitProblemSolution";
import { createCrowdfundedIdea } from "~/server/trpc/procedures/createCrowdfundedIdea";
import { createEcosystem } from "~/server/trpc/procedures/createEcosystem";
import { generateValueCurveData } from "~/server/trpc/procedures/generateValueCurveData";
import { generateHeatMapData } from "~/server/trpc/procedures/generateHeatMapData";

export const appRouter = createTRPCRouter({
  register,
  login,
  createMarket,
  getMarkets,
  getMarketDetails,
  createOpportunity,
  updateOpportunityScore,
  getOpportunities,
  createCompetitor,
  createSegment,
  generateVibeCheck,
  generateOpportunityConnections,
  getOpportunityConnections,
  createBreadcrumb,
  getUserPreferences,
  updateUserPreferences,
  getBoards,
  createBoard,
  updateBoard,
  deleteBoard,
  getBoardDetails,
  addOpportunityToBoard,
  removeOpportunityFromBoard,
  getRadars,
  createRadar,
  updateRadar,
  deleteRadar,
  getRadarMatches,
  getStrategySessions,
  createStrategySession,
  strategyChatStream,
  deleteStrategySession,
  createScenario,
  getScenarios,
  updateScenario,
  deleteScenario,
  createPaymentIntent,
  getSubscriptionTiers,
  getUserSubscription,
  getCreditBalance,
  purchaseCredits,
  checkFeatureAccess,
  // Blue Ocean Enhancement Procedures
  generateCrossIndustryScenarios,
  createBlueOceanCanvas,
  getBlueOceanCanvases,
  updateBlueOceanCanvas,
  generateDynamicSegments,
  analyzeTrendIntersections,
  suggestPartnerships,
  generatePitchDeck,
  predictValueMigration,
  // Marketplace Procedures
  getMarketplaceListings,
  getMarketplaceListingDetails,
  createMarketplaceListing,
  purchaseMarketplaceListing,
  createMarketplaceReview,
  // Challenge Arena Procedures
  getChallenges,
  getChallengeDetails,
  submitChallenge,
  voteOnSubmission,
  getBadges,
  // AI Insights Visualization Procedures
  getTrendIntersections,
  getValueMigrations,
  getPartnerships,
  // New 20 ERRC Feature Procedures
  simulateScenario,
  remixBusinessModel,
  generateCuratedFeed,
  generateMarketReport,
  createProblem,
  submitProblemSolution,
  createCrowdfundedIdea,
  createEcosystem,
  generateValueCurveData,
  generateHeatMapData,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
