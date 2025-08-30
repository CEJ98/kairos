'use client'

import { useState, useEffect } from 'react'

// Breakpoints basados en Tailwind CSS
const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

type Breakpoint = keyof typeof breakpoints
type BreakpointValue = typeof breakpoints[Breakpoint]

interface UseResponsiveReturn {
  // Current screen size
  width: number
  height: number
  
  // Breakpoint checks
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isLargeDesktop: boolean
  
  // Specific breakpoint checks
  isXs: boolean
  isSm: boolean
  isMd: boolean
  isLg: boolean
  isXl: boolean
  is2Xl: boolean
  
  // Utility functions
  isAbove: (breakpoint: Breakpoint) => boolean
  isBelow: (breakpoint: Breakpoint) => boolean
  isBetween: (min: Breakpoint, max: Breakpoint) => boolean
  
  // Device orientation
  isPortrait: boolean
  isLandscape: boolean
  
  // Touch device detection
  isTouchDevice: boolean
  
  // Safe area insets (for devices with notches)
  safeAreaInsets: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

/**
 * Hook personalizado para manejar responsividad y detección de dispositivos
 * Optimizado para rendimiento con debouncing y lazy evaluation
 */
export function useResponsive(): UseResponsiveReturn {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })
  
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  })
  
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    // Detect touch device
    const checkTouchDevice = () => {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0
      )
    }
    
    setIsTouchDevice(checkTouchDevice())
    
    // Get safe area insets
    const getSafeAreaInsets = () => {
      const style = getComputedStyle(document.documentElement)
      return {
        top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
        right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
        bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
        left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
      }
    }
    
    setSafeAreaInsets(getSafeAreaInsets())
    
    // Debounced resize handler
    let timeoutId: NodeJS.Timeout
    
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        })
        setSafeAreaInsets(getSafeAreaInsets())
      }, 150) // 150ms debounce
    }
    
    window.addEventListener('resize', handleResize, { passive: true })
    window.addEventListener('orientationchange', handleResize, { passive: true })
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      clearTimeout(timeoutId)
    }
  }, [])

  const { width, height } = dimensions
  
  // Breakpoint checks
  const isXs = width >= breakpoints.xs && width < breakpoints.sm
  const isSm = width >= breakpoints.sm && width < breakpoints.md
  const isMd = width >= breakpoints.md && width < breakpoints.lg
  const isLg = width >= breakpoints.lg && width < breakpoints.xl
  const isXl = width >= breakpoints.xl && width < breakpoints['2xl']
  const is2Xl = width >= breakpoints['2xl']
  
  // Device categories
  const isMobile = width < breakpoints.md
  const isTablet = width >= breakpoints.md && width < breakpoints.lg
  const isDesktop = width >= breakpoints.lg && width < breakpoints['2xl']
  const isLargeDesktop = width >= breakpoints['2xl']
  
  // Orientation
  const isPortrait = height > width
  const isLandscape = width > height
  
  // Utility functions
  const isAbove = (breakpoint: Breakpoint): boolean => {
    return width >= breakpoints[breakpoint]
  }
  
  const isBelow = (breakpoint: Breakpoint): boolean => {
    return width < breakpoints[breakpoint]
  }
  
  const isBetween = (min: Breakpoint, max: Breakpoint): boolean => {
    return width >= breakpoints[min] && width < breakpoints[max]
  }

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    isAbove,
    isBelow,
    isBetween,
    isPortrait,
    isLandscape,
    isTouchDevice,
    safeAreaInsets,
  }
}

/**
 * Hook simplificado para casos de uso básicos
 */
export function useBreakpoint() {
  const { isMobile, isTablet, isDesktop, isLargeDesktop } = useResponsive()
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
  }
}

/**
 * Hook para detectar si estamos en un dispositivo móvil
 */
export function useIsMobile(): boolean {
  const { isMobile } = useResponsive()
  return isMobile
}

/**
 * Hook para obtener las dimensiones de la pantalla
 */
export function useScreenSize() {
  const { width, height } = useResponsive()
  return { width, height }
}

/**
 * Hook para detectar orientación
 */
export function useOrientation() {
  const { isPortrait, isLandscape } = useResponsive()
  return { isPortrait, isLandscape }
}

/**
 * Hook para safe area insets (útil para dispositivos con notch)
 */
export function useSafeArea() {
  const { safeAreaInsets } = useResponsive()
  return safeAreaInsets
}

/**
 * Utility function para generar clases CSS responsivas
 */
export function responsiveClass(
  base: string,
  sm?: string,
  md?: string,
  lg?: string,
  xl?: string,
  xxl?: string
): string {
  const classes = [base]
  
  if (sm) classes.push(`sm:${sm}`)
  if (md) classes.push(`md:${md}`)
  if (lg) classes.push(`lg:${lg}`)
  if (xl) classes.push(`xl:${xl}`)
  if (xxl) classes.push(`2xl:${xxl}`)
  
  return classes.join(' ')
}

/**
 * Utility function para valores responsivos
 */
export function useResponsiveValue<T>(
  values: {
    xs?: T
    sm?: T
    md?: T
    lg?: T
    xl?: T
    '2xl'?: T
  },
  defaultValue: T
): T {
  const { isXs, isSm, isMd, isLg, isXl, is2Xl } = useResponsive()
  
  if (is2Xl && values['2xl'] !== undefined) return values['2xl']
  if (isXl && values.xl !== undefined) return values.xl
  if (isLg && values.lg !== undefined) return values.lg
  if (isMd && values.md !== undefined) return values.md
  if (isSm && values.sm !== undefined) return values.sm
  if (isXs && values.xs !== undefined) return values.xs
  
  return defaultValue
}