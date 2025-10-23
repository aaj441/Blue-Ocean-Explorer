// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure function execution time
  measureFunction<T extends (...args: any[]) => any>(
    fn: T,
    name: string
  ): T {
    return ((...args: Parameters<T>) => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      
      this.metrics.set(name, end - start);
      console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
      
      return result;
    }) as T;
  }

  // Measure async function execution time
  async measureAsyncFunction<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    name: string
  ): Promise<T> {
    return (async (...args: Parameters<T>) => {
      const start = performance.now();
      const result = await fn(...args);
      const end = performance.now();
      
      this.metrics.set(name, end - start);
      console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
      
      return result;
    }) as T;
  }

  // Measure component render time
  measureRender(componentName: string, renderFn: () => void) {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    
    this.metrics.set(`render_${componentName}`, end - start);
    console.log(`🎨 ${componentName} render: ${(end - start).toFixed(2)}ms`);
  }

  // Measure API call performance
  measureApiCall<T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> {
    const start = performance.now();
    return apiCall().then(result => {
      const end = performance.now();
      this.metrics.set(`api_${endpoint}`, end - start);
      console.log(`🌐 API ${endpoint}: ${(end - start).toFixed(2)}ms`);
      return result;
    });
  }

  // Get performance metrics
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // Get average performance for a metric
  getAverageMetric(metricName: string): number {
    const values = Array.from(this.metrics.entries())
      .filter(([name]) => name.includes(metricName))
      .map(([, value]) => value);
    
    return values.length > 0 
      ? values.reduce((sum, val) => sum + val, 0) / values.length 
      : 0;
  }

  // Clear metrics
  clearMetrics() {
    this.metrics.clear();
  }

  // Monitor Core Web Vitals
  monitorWebVitals() {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.set('LCP', lastEntry.startTime);
      console.log('📊 LCP:', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.metrics.set('FID', entry.processingStart - entry.startTime);
        console.log('📊 FID:', entry.processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    new PerformanceObserver((list) => {
      let clsValue = 0;
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.metrics.set('CLS', clsValue);
      console.log('📊 CLS:', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }

  // Monitor bundle size
  monitorBundleSize() {
    if (typeof window === 'undefined') return;

    const scripts = Array.from(document.querySelectorAll('script[src]'));
    let totalSize = 0;

    scripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src) {
        fetch(src, { method: 'HEAD' })
          .then(response => {
            const contentLength = response.headers.get('content-length');
            if (contentLength) {
              totalSize += parseInt(contentLength);
              this.metrics.set('bundle_size', totalSize);
              console.log('📦 Bundle size:', (totalSize / 1024).toFixed(2) + 'KB');
            }
          })
          .catch(() => {});
      }
    });
  }

  // Generate performance report
  generateReport(): string {
    const metrics = this.getMetrics();
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      summary: {
        totalApiCalls: Object.keys(metrics).filter(k => k.startsWith('api_')).length,
        averageApiTime: this.getAverageMetric('api_'),
        totalRenders: Object.keys(metrics).filter(k => k.startsWith('render_')).length,
        averageRenderTime: this.getAverageMetric('render_'),
        bundleSize: metrics.bundle_size || 0,
        lcp: metrics.LCP || 0,
        fid: metrics.FID || 0,
        cls: metrics.CLS || 0,
      }
    };

    return JSON.stringify(report, null, 2);
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();
  
  return {
    measureFunction: monitor.measureFunction.bind(monitor),
    measureAsyncFunction: monitor.measureAsyncFunction.bind(monitor),
    measureRender: monitor.measureRender.bind(monitor),
    measureApiCall: monitor.measureApiCall.bind(monitor),
    getMetrics: monitor.getMetrics.bind(monitor),
    clearMetrics: monitor.clearMetrics.bind(monitor),
  };
}

// Higher-order component for performance monitoring
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  const WrappedComponent = (props: P) => {
    const monitor = PerformanceMonitor.getInstance();
    
    React.useEffect(() => {
      monitor.measureRender(componentName, () => {});
    });

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withPerformanceMonitoring(${componentName})`;
  return WrappedComponent;
}

// Debounce utility for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for performance
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memoization utility
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Image lazy loading utility
export function createLazyImageLoader() {
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        if (src) {
          img.src = src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      }
    });
  });

  return imageObserver;
}

// Resource preloading
export function preloadResource(href: string, as: string) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

// Critical resource preloading
export function preloadCriticalResources() {
  // Preload critical fonts
  preloadResource('/fonts/inter.woff2', 'font');
  
  // Preload critical images
  preloadResource('/images/hero-bg.jpg', 'image');
  
  // Preload critical API endpoints
  preloadResource('/api/markets', 'fetch');
}

// Performance budget monitoring
export class PerformanceBudget {
  private static thresholds = {
    LCP: 2500, // 2.5s
    FID: 100,  // 100ms
    CLS: 0.1,  // 0.1
    bundleSize: 500000, // 500KB
  };

  static checkBudget(metrics: Record<string, number>): {
    passed: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    if (metrics.LCP > this.thresholds.LCP) {
      violations.push(`LCP exceeded: ${metrics.LCP}ms > ${this.thresholds.LCP}ms`);
    }

    if (metrics.FID > this.thresholds.FID) {
      violations.push(`FID exceeded: ${metrics.FID}ms > ${this.thresholds.FID}ms`);
    }

    if (metrics.CLS > this.thresholds.CLS) {
      violations.push(`CLS exceeded: ${metrics.CLS} > ${this.thresholds.CLS}`);
    }

    if (metrics.bundle_size > this.thresholds.bundleSize) {
      violations.push(`Bundle size exceeded: ${metrics.bundle_size} bytes > ${this.thresholds.bundleSize} bytes`);
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }
}