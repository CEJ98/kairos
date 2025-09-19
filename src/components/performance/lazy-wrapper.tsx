'use client';

import React, { Suspense, lazy, ComponentType, ReactNode, useState, useRef, useEffect } from 'react';

interface LazyWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

// Componente wrapper para lazy loading
export function LazyWrapper({ 
  children, 
  fallback, 
  className = '' 
}: LazyWrapperProps) {
  const defaultFallback = (
    <div className={`space-y-4 ${className}`}>
      <div className="h-8 w-full bg-gray-200 animate-pulse rounded" />
      <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
      <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded" />
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
}

// HOC para crear componentes lazy
export function withLazyLoading<T extends Record<string, any>>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFn);
  
  return function WrappedComponent(props: T) {
    return (
      <LazyWrapper fallback={fallback}>
        <LazyComponent {...(props as any)} />
      </LazyWrapper>
    );
  };
}

// Componente para cargar módulos bajo demanda
interface DynamicLoaderProps<T extends Record<string, any>> {
  loader: () => Promise<{ default: ComponentType<T> }>;
  props: T;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  className?: string;
}

export function DynamicLoader<T extends Record<string, any>>({
  loader,
  props,
  fallback,
  errorFallback,
  className = ''
}: DynamicLoaderProps<T>) {
  const LazyComponent = lazy(loader);
  
  const defaultErrorFallback = (
    <div className={`p-4 text-center text-red-500 ${className}`}>
      <p>Error al cargar el componente</p>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Reintentar
      </button>
    </div>
  );

  return (
    <LazyWrapper fallback={fallback} className={className}>
      <ErrorBoundary fallback={errorFallback || defaultErrorFallback}>
        <LazyComponent {...(props as any)} />
      </ErrorBoundary>
    </LazyWrapper>
  );
}

// Error Boundary para manejar errores de carga
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error en lazy loading:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Hook para precargar componentes
export function usePreloadComponent<T>(
  loader: () => Promise<{ default: ComponentType<T> }>
) {
  const preload = () => {
    loader().catch(error => {
      console.error('Error precargando componente:', error);
    });
  };

  return preload;
}

// Utilidades para lazy loading condicional
export function createConditionalLazy<T extends object>(
  condition: () => boolean,
  lazyLoader: () => Promise<{ default: ComponentType<T> }>,
  fallbackLoader: () => Promise<{ default: ComponentType<T> }>
) {
  return lazy(async () => {
    if (condition()) {
      return lazyLoader();
    }
    return fallbackLoader();
  });
}

// Componente para lazy loading basado en viewport
interface ViewportLazyProps<T> {
  loader: () => Promise<{ default: ComponentType<T> }>;
  props: T;
  threshold?: number;
  rootMargin?: string;
  fallback?: ReactNode;
  className?: string;
}

export function ViewportLazy<T extends object>({
  loader,
  props,
  threshold = 0.1,
  rootMargin = '50px',
  fallback,
  className = ''
}: ViewportLazyProps<T>) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div ref={ref} className={className}>
      {shouldLoad ? (
        <DynamicLoader
          loader={loader}
          props={props}
          fallback={fallback}
          className={className}
        />
      ) : (
        fallback || <div className="h-32 w-full bg-gray-200 animate-pulse rounded" />
      )}
    </div>
  );
}