import React, { Suspense, lazy } from 'react';
import LoadingSkeleton, { 
  AdvisorCardSkeleton, 
  ConsultationSkeleton, 
  MultiDomainSkeleton 
} from '../common/LoadingSkeleton';
import ErrorBoundary from '../common/ErrorBoundary';

// Lazy load heavy components
const AdvisorSelectionPanel = lazy(() => import('../advisors/AdvisorSelectionPanel'));
const ConsultationInterface = lazy(() => import('../consultation/ConsultationInterface'));
const MultiDomainAdvisorPanel = lazy(() => import('../advisors/MultiDomainAdvisorPanel'));
const MultiDomainConsultationInterface = lazy(() => import('../consultation/MultiDomainConsultationInterface'));
const ResponsePanel = lazy(() => import('../consultation/ResponsePanel'));
const SessionManager = lazy(() => import('../session/SessionManager'));
const ExportOptions = lazy(() => import('../session/ExportOptions'));

// Wrapper component for lazy loading with error boundaries and loading states
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  resetKeys?: Array<string | number>;
}

const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback,
  errorFallback,
  resetKeys = [],
}) => (
  <ErrorBoundary 
    fallback={errorFallback}
    resetKeys={resetKeys}
    resetOnPropsChange={true}
  >
    <Suspense fallback={fallback || <LoadingSkeleton height="20rem" />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

// Lazy-loaded advisor selection with skeleton
export const LazyAdvisorSelectionPanel: React.FC<React.ComponentProps<typeof AdvisorSelectionPanel>> = (props) => (
  <LazyWrapper 
    fallback={
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <LoadingSkeleton height="2rem" width="60%" className="mb-2" />
          <LoadingSkeleton height="1rem" width="40%" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }, (_, i) => (
            <AdvisorCardSkeleton key={i} />
          ))}
        </div>
      </div>
    }
    resetKeys={[props.domainId]}
  >
    <AdvisorSelectionPanel {...props} />
  </LazyWrapper>
);

// Lazy-loaded consultation interface with skeleton
export const LazyConsultationInterface: React.FC<React.ComponentProps<typeof ConsultationInterface>> = (props) => (
  <LazyWrapper 
    fallback={<ConsultationSkeleton advisorCount={props.selectedAdvisors?.length || 3} />}
    resetKeys={[props.selectedAdvisors?.map(a => a.id).join(',')]}
  >
    <ConsultationInterface {...props} />
  </LazyWrapper>
);

// Lazy-loaded multi-domain advisor panel with skeleton
export const LazyMultiDomainAdvisorPanel: React.FC<React.ComponentProps<typeof MultiDomainAdvisorPanel>> = (props) => (
  <LazyWrapper 
    fallback={<MultiDomainSkeleton />}
  >
    <MultiDomainAdvisorPanel {...props} />
  </LazyWrapper>
);

// Lazy-loaded multi-domain consultation interface with skeleton
export const LazyMultiDomainConsultationInterface: React.FC<React.ComponentProps<typeof MultiDomainConsultationInterface>> = (props) => (
  <LazyWrapper 
    fallback={<ConsultationSkeleton advisorCount={props.selectedAdvisors?.length || 6} />}
    resetKeys={[props.selectedAdvisors?.map(a => a.id).join(','), props.domains?.join(',')]}
  >
    <MultiDomainConsultationInterface {...props} />
  </LazyWrapper>
);

// Lazy-loaded response panel with skeleton
export const LazyResponsePanel: React.FC<React.ComponentProps<typeof ResponsePanel>> = (props) => (
  <LazyWrapper 
    fallback={
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: props.advisors?.length || 3 }, (_, i) => (
          <div key={i} className="p-6 border border-neutral-200 rounded-lg bg-white">
            <LoadingSkeleton height="1.5rem" width="60%" className="mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 5 }, (_, j) => (
                <LoadingSkeleton key={j} height="1rem" width={`${85 + Math.random() * 15}%`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    }
    resetKeys={[props.responses?.length, props.prompt]}
  >
    <ResponsePanel {...props} />
  </LazyWrapper>
);

// Lazy-loaded session manager with skeleton
export const LazySessionManager: React.FC<React.ComponentProps<typeof SessionManager>> = (props) => (
  <LazyWrapper 
    fallback={
      <div className="p-6">
        <LoadingSkeleton height="1.5rem" width="40%" className="mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="p-4 border border-neutral-200 rounded-lg">
              <LoadingSkeleton height="1rem" width="70%" className="mb-2" />
              <LoadingSkeleton height="0.875rem" width="50%" />
            </div>
          ))}
        </div>
      </div>
    }
  >
    <SessionManager {...props} />
  </LazyWrapper>
);

// Lazy-loaded export options with skeleton
export const LazyExportOptions: React.FC<React.ComponentProps<typeof ExportOptions>> = (props) => (
  <LazyWrapper 
    fallback={
      <div className="p-4 border border-neutral-200 rounded-lg">
        <LoadingSkeleton height="1.25rem" width="50%" className="mb-3" />
        <div className="flex space-x-3">
          <LoadingSkeleton height="2.5rem" width="6rem" />
          <LoadingSkeleton height="2.5rem" width="6rem" />
        </div>
      </div>
    }
  >
    <ExportOptions {...props} />
  </LazyWrapper>
);

// Performance monitoring wrapper
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  const WrappedComponent: React.FC<P> = (props) => {
    React.useEffect(() => {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        // Log performance metrics (in development)
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 ${componentName} render time: ${renderTime.toFixed(2)}ms`);
          
          // Warn about slow renders
          if (renderTime > 100) {
            console.warn(`⚠️ Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
          }
        }
        
        // In production, send to analytics
        // analytics.track('component_render_time', {
        //   component: componentName,
        //   renderTime,
        //   timestamp: Date.now(),
        // });
      };
    });

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withPerformanceMonitoring(${componentName})`;
  return WrappedComponent;
};

export default {
  LazyAdvisorSelectionPanel,
  LazyConsultationInterface,
  LazyMultiDomainAdvisorPanel,
  LazyMultiDomainConsultationInterface,
  LazyResponsePanel,
  LazySessionManager,
  LazyExportOptions,
  withPerformanceMonitoring,
};