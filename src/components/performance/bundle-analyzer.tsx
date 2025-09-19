'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface BundleStats {
  totalSize: number;
  gzippedSize: number;
  chunks: Array<{
    name: string;
    size: number;
    gzippedSize: number;
    modules: number;
  }>;
  assets: Array<{
    name: string;
    size: number;
    type: string;
  }>;
  warnings: string[];
  recommendations: string[];
}

interface BundleAnalyzerProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function BundleAnalyzer({ 
  className = '', 
  autoRefresh = false, 
  refreshInterval = 30000 
}: BundleAnalyzerProps) {
  const [stats, setStats] = useState<BundleStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchBundleStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // En desarrollo, simular datos del bundle
      if (process.env.NODE_ENV === 'development') {
        const mockStats: BundleStats = {
          totalSize: 2.4 * 1024 * 1024, // 2.4MB
          gzippedSize: 0.8 * 1024 * 1024, // 800KB
          chunks: [
            {
              name: 'main',
              size: 1.2 * 1024 * 1024,
              gzippedSize: 400 * 1024,
              modules: 245
            },
            {
              name: 'vendor',
              size: 0.8 * 1024 * 1024,
              gzippedSize: 250 * 1024,
              modules: 156
            },
            {
              name: 'runtime',
              size: 50 * 1024,
              gzippedSize: 15 * 1024,
              modules: 12
            }
          ],
          assets: [
            { name: 'main.js', size: 1.2 * 1024 * 1024, type: 'javascript' },
            { name: 'vendor.js', size: 0.8 * 1024 * 1024, type: 'javascript' },
            { name: 'styles.css', size: 150 * 1024, type: 'stylesheet' },
            { name: 'images', size: 250 * 1024, type: 'assets' }
          ],
          warnings: [
            'Bundle size excede 2MB recomendado',
            'Chunk vendor muy grande (>500KB)'
          ],
          recommendations: [
            'Considerar code splitting para reducir el bundle principal',
            'Implementar lazy loading para componentes no críticos',
            'Optimizar imágenes y usar formatos modernos (WebP, AVIF)'
          ]
        };
        
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStats(mockStats);
      } else {
        // En producción, obtener stats reales del bundle
        const response = await fetch('/api/bundle-stats');
        if (!response.ok) {
          throw new Error('Error obteniendo estadísticas del bundle');
        }
        const data = await response.json();
        setStats(data);
      }
      
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBundleStats();
  }, []);

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchBundleStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCompressionRatio = (original: number, compressed: number): number => {
    return ((original - compressed) / original) * 100;
  };

  const getSizeColor = (size: number, type: 'chunk' | 'total' = 'chunk'): string => {
    const thresholds = type === 'total' 
      ? { warning: 2 * 1024 * 1024, critical: 5 * 1024 * 1024 } // 2MB, 5MB
      : { warning: 500 * 1024, critical: 1024 * 1024 }; // 500KB, 1MB
    
    if (size >= thresholds.critical) return 'text-red-600';
    if (size >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading && !stats) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Analizador de Bundle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            <span className="ml-2">Analizando bundle...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Analizador de Bundle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchBundleStats} variant="outline">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Resumen General */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Resumen del Bundle</CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-sm text-muted-foreground">
                Actualizado: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button 
              onClick={fetchBundleStats} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getSizeColor(stats.totalSize, 'total')}`}>
                {formatSize(stats.totalSize)}
              </div>
              <div className="text-sm text-muted-foreground">Tamaño Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatSize(stats.gzippedSize)}
              </div>
              <div className="text-sm text-muted-foreground">Comprimido (Gzip)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {getCompressionRatio(stats.totalSize, stats.gzippedSize).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Compresión</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análisis de Chunks */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Chunks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.chunks.map((chunk, index) => {
              const percentage = (chunk.size / stats.totalSize) * 100;
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{chunk.name}</span>
                    <div className="text-right">
                      <div className={`font-bold ${getSizeColor(chunk.size)}`}>
                        {formatSize(chunk.size)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {chunk.modules} módulos
                      </div>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{percentage.toFixed(1)}% del total</span>
                    <span>Gzip: {formatSize(chunk.gzippedSize)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Assets */}
      <Card>
        <CardHeader>
          <CardTitle>Assets por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.assets.map((asset, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{asset.name}</span>
                  <span className="ml-2 text-sm text-muted-foreground">({asset.type})</span>
                </div>
                <span className={`font-bold ${getSizeColor(asset.size)}`}>
                  {formatSize(asset.size)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advertencias */}
      {stats.warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600">⚠️ Advertencias</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {stats.warnings.map((warning, index) => (
                <li key={index} className="text-yellow-700 flex items-start">
                  <span className="mr-2">•</span>
                  {warning}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recomendaciones */}
      {stats.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">💡 Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {stats.recommendations.map((recommendation, index) => (
                <li key={index} className="text-blue-700 flex items-start">
                  <span className="mr-2">•</span>
                  {recommendation}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}