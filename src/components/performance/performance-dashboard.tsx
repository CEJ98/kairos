'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PerformanceMonitorComponent } from './performance-monitor';
import { BundleAnalyzer } from './bundle-analyzer';
import { LazyWrapper } from './lazy-wrapper';
import { CacheManager, CacheKeys } from '@/lib/cache-manager';
import { usePerformanceMetrics, useWebVitals, useMemoryMonitor } from '@/hooks/usePerformanceOptimization';

interface PerformanceDashboardProps {
  className?: string;
  defaultTab?: string;
}

export function PerformanceDashboard({ 
  className = '', 
  defaultTab = 'overview' 
}: PerformanceDashboardProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  const performanceMetrics = usePerformanceMetrics('PerformanceDashboard');
  const webVitals = useWebVitals() || {};
  const memoryInfo = useMemoryMonitor();
  
  const [cacheStats, setCacheStats] = useState({
    size: 0,
    hitRate: 0,
    memoryUsage: 0,
    expiredItems: 0,
    mostAccessed: [] as Array<{ key: string; accessCount: number }>
  });

  const getOverallScore = () => {
    if (!webVitals || typeof webVitals !== 'object') return 0;
    
    const cls = (webVitals as any).CLS || 0;
    const fid = (webVitals as any).FID || 0;
    const lcp = (webVitals as any).LCP || 0;
    const fcp = (webVitals as any).FCP || 0;
    
    const vitalsScore = (
      (cls < 0.1 ? 25 : cls < 0.25 ? 15 : 5) +
      (fid < 100 ? 25 : fid < 300 ? 15 : 5) +
      (lcp < 2500 ? 25 : lcp < 4000 ? 15 : 5) +
      (fcp < 1800 ? 25 : fcp < 3000 ? 15 : 5)
    );
    
    return Math.min(100, vitalsScore);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800">Excelente</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800">Bueno</Badge>;
    return <Badge className="bg-red-100 text-red-800">Necesita Mejoras</Badge>;
  };

  const clearAllCaches = () => {
    const cacheManager = CacheManager.getInstance();
    cacheManager.clear(CacheKeys.USER_PROFILE);
    cacheManager.clear(CacheKeys.USER_WORKOUTS);
    cacheManager.clear(CacheKeys.WORKOUT_DETAILS);
    // Limpiar otros caches si es necesario
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
  };
  
  const updateCacheStats = () => {
    const cacheManager = CacheManager.getInstance();
    const stats = cacheManager.getStats?.() || { totalOperations: 0, hitRate: 0 };
    setCacheStats({
      size: stats.totalOperations,
      hitRate: stats.hitRate,
      memoryUsage: 0,
      expiredItems: 0,
      mostAccessed: []
    });
  };

  const overallScore = getOverallScore();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con Score General */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Dashboard de Performance</CardTitle>
              <p className="text-muted-foreground mt-1">
                Monitoreo en tiempo real del rendimiento de la aplicación
              </p>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}
              </div>
              <div className="text-sm text-muted-foreground mb-2">Score General</div>
              {getScoreBadge(overallScore)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
            >
              {autoRefresh ? '⏸️ Pausar' : '▶️ Auto-refresh'}
            </Button>
            <Button 
              onClick={clearAllCaches}
              variant="outline"
              size="sm"
            >
              🗑️ Limpiar Cache
            </Button>
            <div className="text-sm text-muted-foreground">
              Cache: {cacheStats.size} elementos
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Contenido */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="vitals">Web Vitals</TabsTrigger>
          <TabsTrigger value="bundle">Bundle</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Métricas Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Métricas Clave</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {webVitals && typeof webVitals === 'object' && (
                    <>
                      <div className="flex justify-between">
                        <span>Largest Contentful Paint</span>
                        <span className={(webVitals as any).LCP < 2500 ? 'text-green-600' : 'text-red-600'}>
                          {(webVitals as any).LCP || 0}ms
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>First Input Delay</span>
                        <span className={(webVitals as any).FID < 100 ? 'text-green-600' : 'text-red-600'}>
                          {(webVitals as any).FID || 0}ms
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cumulative Layout Shift</span>
                        <span className={(webVitals as any).CLS < 0.1 ? 'text-green-600' : 'text-red-600'}>
                          {((webVitals as any).CLS || 0).toFixed(3)}
                        </span>
                      </div>
                    </>
                  )}
                  {memoryInfo && (
                    <div className="flex justify-between">
                      <span>Memoria Usada</span>
                      <span className="text-blue-600">
                        {(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Estado del Sistema */}
            <Card>
              <CardHeader>
                <CardTitle>Estado del Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Conexión</span>
                    <Badge className="bg-green-100 text-green-800">
                      {navigator.onLine ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Service Worker</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {'serviceWorker' in navigator ? 'Disponible' : 'No disponible'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Cache API</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {'caches' in window ? 'Disponible' : 'No disponible'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Local Storage</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {typeof Storage !== 'undefined' ? 'Disponible' : 'No disponible'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recomendaciones */}
          <Card>
            <CardHeader>
              <CardTitle>💡 Recomendaciones de Optimización</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overallScore < 70 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800">
                      <strong>Prioridad Alta:</strong> El score general está por debajo de 70. 
                      Revisa las métricas de Web Vitals y considera optimizar los recursos críticos.
                    </p>
                  </div>
                )}
                {webVitals && (webVitals as any).LCP > 2500 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-800">
                      <strong>LCP Alto:</strong> Optimiza la carga de imágenes y recursos críticos.
                    </p>
                  </div>
                )}
                {memoryInfo && memoryInfo.usedJSHeapSize > 50 * 1024 * 1024 && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                    <p className="text-orange-800">
                      <strong>Uso de Memoria Alto:</strong> Considera implementar lazy loading y limpieza de memoria.
                    </p>
                  </div>
                )}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-blue-800">
                    <strong>Tip:</strong> Usa el auto-refresh para monitorear cambios en tiempo real.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Web Vitals */}
        <TabsContent value="vitals">
          <PerformanceMonitorComponent 
            className="w-full"
            showDetails
          />
        </TabsContent>

        {/* Tab: Bundle */}
        <TabsContent value="bundle">
          <LazyWrapper fallback={
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  <span className="ml-2">Cargando analizador de bundle...</span>
                </div>
              </CardContent>
            </Card>
          }>
            <BundleAnalyzer 
              autoRefresh={autoRefresh}
              refreshInterval={60000}
            />
          </LazyWrapper>
        </TabsContent>

        {/* Tab: Cache */}
        <TabsContent value="cache">
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de Cache</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {cacheStats.size}
                  </div>
                  <div className="text-sm text-muted-foreground">Elementos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {cacheStats.hitRate?.toFixed(1) || 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Hit Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round((cacheStats.memoryUsage || 0) / 1024)}KB
                  </div>
                  <div className="text-sm text-muted-foreground">Memoria</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {cacheStats.expiredItems || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Expirados</div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Elementos Más Accedidos</h4>
                <div className="space-y-2">
                  {cacheStats.mostAccessed?.slice(0, 5).map((item: { key: string; accessCount: number }, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-mono text-sm">{item.key}</span>
                      <Badge variant="secondary">{item.accessCount} accesos</Badge>
                    </div>
                  )) || (
                    <p className="text-muted-foreground text-sm">No hay datos disponibles</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <Button onClick={clearAllCaches} variant="destructive" size="sm">
                  Limpiar Cache
                </Button>
                <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                  Recargar Página
                </Button>
                <Button onClick={updateCacheStats} variant="outline" size="sm">
                  Actualizar Stats
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
