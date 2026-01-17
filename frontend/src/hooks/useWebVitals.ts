import { useEffect } from 'react';
import { logger } from '@/lib/logger';

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

const thresholds = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = thresholds[name as keyof typeof thresholds];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

function sendToAnalytics(metric: WebVitalsMetric) {
  // Log in development
  if (import.meta.env.DEV) {
    const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
    logger.info(`${emoji} Web Vital: ${metric.name}`, {
      value: Math.round(metric.value),
      rating: metric.rating,
    });
  }

  // TODO: Send to analytics service (Google Analytics, etc.)
  // gtag('event', metric.name, {
  //   value: Math.round(metric.value),
  //   metric_rating: metric.rating,
  //   metric_delta: Math.round(metric.delta),
  // });
}

export function useWebVitals() {
  useEffect(() => {
    // Dynamically import web-vitals to avoid bundling if not used
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
      const handleMetric = (metric: any) => {
        const webVitalsMetric: WebVitalsMetric = {
          name: metric.name,
          value: metric.value,
          rating: getRating(metric.name, metric.value),
          delta: metric.delta,
          id: metric.id,
        };
        sendToAnalytics(webVitalsMetric);
      };

      onCLS(handleMetric);
      onFID(handleMetric);
      onFCP(handleMetric);
      onLCP(handleMetric);
      onTTFB(handleMetric);
      onINP(handleMetric);
    }).catch((error) => {
      logger.error('Failed to load web-vitals', error);
    });
  }, []);
}

// Standalone function for manual reporting
export function reportWebVitals() {
  import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
    const handleMetric = (metric: any) => {
      const webVitalsMetric: WebVitalsMetric = {
        name: metric.name,
        value: metric.value,
        rating: getRating(metric.name, metric.value),
        delta: metric.delta,
        id: metric.id,
      };
      sendToAnalytics(webVitalsMetric);
    };

    onCLS(handleMetric);
    onFID(handleMetric);
    onFCP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);
    onINP(handleMetric);
  });
}
