import { lazy, Suspense } from "react";
import { LoadingSpinner, ChartSkeleton } from "./LoadingStates";

// Lazy load chart components
export const LazyTrendsChart = lazy(() => 
  import("./charts/TrendsChart").then(module => ({ default: module.TrendsChart }))
);

export const LazyOpportunityConstellationChart = lazy(() => 
  import("./charts/OpportunityConstellationChart").then(module => ({ default: module.OpportunityConstellationChart }))
);

export const LazyOpportunityStatusChart = lazy(() => 
  import("./charts/OpportunityStatusChart").then(module => ({ default: module.OpportunityStatusChart }))
);

export const LazySegmentSizeChart = lazy(() => 
  import("./charts/SegmentSizeChart").then(module => ({ default: module.SegmentSizeChart }))
);

export const LazyValueMigrationsChart = lazy(() => 
  import("./charts/ValueMigrationsChart").then(module => ({ default: module.ValueMigrationsChart }))
);

export const LazyTrendIntersectionsChart = lazy(() => 
  import("./charts/TrendIntersectionsChart").then(module => ({ default: module.TrendIntersectionsChart }))
);

// Lazy load page components
export const LazyDashboard = lazy(() => 
  import("../routes/dashboard/index").then(module => ({ default: module.DashboardPage }))
);

export const LazyBoards = lazy(() => 
  import("../routes/boards/index").then(module => ({ default: module.BoardsPage }))
);

export const LazyStrategy = lazy(() => 
  import("../routes/strategy/index").then(module => ({ default: module.StrategyPage }))
);

export const LazyMarkets = lazy(() => 
  import("../routes/markets/index").then(module => ({ default: module.MarketsPage }))
);

export const LazyMarketplace = lazy(() => 
  import("../routes/marketplace/index").then(module => ({ default: module.MarketplacePage }))
);

export const LazyChallenges = lazy(() => 
  import("../routes/challenges/index").then(module => ({ default: module.ChallengesPage }))
);

export const LazyPricing = lazy(() => 
  import("../routes/pricing/index").then(module => ({ default: module.PricingPage }))
);

export const LazyCredits = lazy(() => 
  import("../routes/credits/index").then(module => ({ default: module.CreditsPage }))
);

// Lazy load utility components
export const LazyExportMenu = lazy(() => 
  import("./ExportMenu").then(module => ({ default: module.ExportMenu }))
);

export const LazyHelpTooltip = lazy(() => 
  import("./HelpTooltip").then(module => ({ default: module.HelpTooltip }))
);

// Chart wrapper with loading state
export function ChartWrapper({ children, ...props }: any) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      {children}
    </Suspense>
  );
}

// Page wrapper with loading state
export function PageWrapper({ children, ...props }: any) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading page..." />
      </div>
    }>
      {children}
    </Suspense>
  );
}

// Component wrapper with loading state
export function ComponentWrapper({ children, fallback, ...props }: any) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      {children}
    </Suspense>
  );
}

// Preload components for better UX
export function preloadComponents() {
  // Preload critical components
  import("./charts/TrendsChart");
  import("./charts/OpportunityStatusChart");
  import("./ExportMenu");
  import("./HelpTooltip");
}

// Preload on user interaction
export function preloadOnHover() {
  const preloadMap = new Map();
  
  return (componentName: string) => {
    if (preloadMap.has(componentName)) return;
    
    preloadMap.set(componentName, true);
    
    switch (componentName) {
      case 'constellation':
        import("./charts/OpportunityConstellationChart");
        break;
      case 'segments':
        import("./charts/SegmentSizeChart");
        break;
      case 'value-migrations':
        import("./charts/ValueMigrationsChart");
        break;
      case 'trend-intersections':
        import("./charts/TrendIntersectionsChart");
        break;
      case 'strategy':
        import("../routes/strategy/index");
        break;
      case 'boards':
        import("../routes/boards/index");
        break;
      case 'marketplace':
        import("../routes/marketplace/index");
        break;
      case 'challenges':
        import("../routes/challenges/index");
        break;
    }
  };
}