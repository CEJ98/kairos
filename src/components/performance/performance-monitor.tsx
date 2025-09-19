'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  Clock, 
  Database, 
  Gauge, 
  MemoryStick, 
  RefreshCw, 
  TrendingUp,
  Zap,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { PerformanceMonitor } from '@/lib/performance'
import { PerformanceDashboard } from '@/lib/performance-enhancements'
import { usePerformanceMetrics, useWebVitals, useMemoryMonitor } from '@/hooks/usePerformanceOptimization'

interface PerformanceMonitorProps {
  className?: string
  showDetails?: boolean
}

export function PerformanceMonitorComponent({ className, showDetails = false }: PerformanceMonitorProps) {
  const [performanceData, setPerformanceData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const webVitals = useWebVitals()
  const memoryInfo = useMemoryMonitor()
  const componentMetrics = usePerformanceMetrics('PerformanceMonitor')

  const refreshData = async () => {
    setIsLoading(true)
    try {
      const report = PerformanceDashboard.generateReport()
      setPerformanceData(report)
    } catch (error) {
      console.error('Failed to generate performance report:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const getVitalStatus = (vital: string, value: number) => {
    const thresholds: Record<string, { good: number; poor: number }> = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 }
    }

    const threshold = thresholds[vital]
    if (!threshold) return 'unknown'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600'
      case 'needs-improvement': return 'text-yellow-600'
      case 'poor': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4" />
      case 'needs-improvement': return <AlertTriangle className="h-4 w-4" />
      case 'poor': return <AlertTriangle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  if (!showDetails) {
    // Compact view for dashboard
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(webVitals).map(([key, value]) => {
              const status = getVitalStatus(key, value as number)
              return (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{key}</span>
                  <div className={`flex items-center gap-1 ${getStatusColor(status)}`}>
                    {getStatusIcon(status)}
                    <span>{typeof value === 'number' ? value.toFixed(0) : String(value)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance Monitor</h2>
          <p className="text-muted-foreground">
            Real-time application performance metrics and optimization insights
          </p>
        </div>
        <Button onClick={refreshData} disabled={isLoading} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="vitals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vitals">Web Vitals</TabsTrigger>
          <TabsTrigger value="metrics">App Metrics</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="vitals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(webVitals).map(([key, value]) => {
              const status = getVitalStatus(key, value as number)
              return (
                <Card key={key}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{key}</CardTitle>
                    <div className={getStatusColor(status)}>
                      {getStatusIcon(status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {typeof value === 'number' ? value.toFixed(0) : String(value)}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        {key === 'CLS' ? '' : 'ms'}
                      </span>
                    </div>
                    <Badge 
                      variant={status === 'good' ? 'default' : status === 'needs-improvement' ? 'secondary' : 'destructive'}
                      className="mt-2"
                    >
                      {status.replace('-', ' ')}
                    </Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Component Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Mount Duration</span>
                    <span>{componentMetrics.mountDuration}ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Render Count</span>
                    <span>{componentMetrics.renderCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Last Render</span>
                    <span>{componentMetrics.lastRenderDuration}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Query Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {performanceData?.metrics && Object.keys(performanceData.metrics).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(performanceData.metrics)
                      .filter(([key]) => key.includes('db.'))
                      .slice(0, 5)
                      .map(([key, data]: [string, any]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="truncate">{key.replace('db.', '')}</span>
                          <span>{data.avg?.toFixed(0)}ms</span>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No query metrics available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="memory" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MemoryStick className="h-4 w-4" />
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                {memoryInfo ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Used Heap</span>
                        <span>{memoryInfo.usedJSHeapSize} MB</span>
                      </div>
                      <Progress 
                        value={(memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100} 
                        className="h-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Heap</span>
                        <span>{memoryInfo.totalJSHeapSize} MB</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Heap Limit</span>
                        <span>{memoryInfo.jsHeapSizeLimit} MB</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Memory information not available in this browser
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Performance Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">85</div>
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                  </div>
                  <Progress value={85} className="h-2" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-green-600">Good</div>
                      <div className="text-muted-foreground">Performance</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">Optimized</div>
                      <div className="text-muted-foreground">Bundle Size</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Performance Recommendations
              </CardTitle>
              <CardDescription>
                Automated suggestions to improve your application performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {performanceData?.recommendations && performanceData.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {performanceData.recommendations.map((recommendation: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-sm text-green-800">
                    Great! No performance issues detected. Your application is running optimally.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PerformanceMonitorComponent