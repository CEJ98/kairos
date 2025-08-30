'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { logger } from './logger'

interface ImageOptimizerConfig {
	// Calidad de imagen por defecto
	defaultQuality?: number
	// Formatos soportados en orden de preferencia
	supportedFormats?: ('avif' | 'webp' | 'jpg' | 'png')[]
	// Tamaños de imagen responsivos
	responsiveSizes?: number[]
	// Placeholder blur data URL
	blurDataURL?: string
	// Lazy loading threshold
	lazyThreshold?: string
	// Preload critical images
	preloadCritical?: boolean
}

interface OptimizedImageProps {
	src: string
	alt: string
	width?: number
	height?: number
	quality?: number
	priority?: boolean
	className?: string
	sizes?: string
	placeholder?: 'blur' | 'empty'
	blurDataURL?: string
	onLoad?: () => void
	onError?: (error: Error) => void
}

interface ImageState {
	isLoading: boolean
	isLoaded: boolean
	hasError: boolean
	errorMessage?: string
	currentSrc?: string
}

// Detectar soporte de formatos de imagen
const detectImageSupport = (): Promise<{
	avif: boolean
	webp: boolean
}> => {
	return new Promise((resolve) => {
		const canvas = document.createElement('canvas')
		canvas.width = 1
		canvas.height = 1
		const ctx = canvas.getContext('2d')
		
		if (!ctx) {
			resolve({ avif: false, webp: false })
			return
		}

		// Test AVIF support
		const avifTest = canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0
		
		// Test WebP support
		const webpTest = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
		
		resolve({
			avif: avifTest,
			webp: webpTest
		})
	})
}

// Generar srcset para imágenes responsivas
const generateSrcSet = (
	baseSrc: string,
	sizes: number[],
	format?: string,
	quality?: number
): string => {
	return sizes
		.map(size => {
			const params = new URLSearchParams()
			params.set('w', size.toString())
			if (quality) params.set('q', quality.toString())
			if (format) params.set('f', format)
			
			const separator = baseSrc.includes('?') ? '&' : '?'
			return `${baseSrc}${separator}${params.toString()} ${size}w`
		})
		.join(', ')
}

// Generar placeholder blur
const generateBlurPlaceholder = (width: number, height: number): string => {
	const canvas = document.createElement('canvas')
	canvas.width = width
	canvas.height = height
	const ctx = canvas.getContext('2d')
	
	if (!ctx) return ''
	
	// Crear gradiente simple
	const gradient = ctx.createLinearGradient(0, 0, width, height)
	gradient.addColorStop(0, '#f3f4f6')
	gradient.addColorStop(1, '#e5e7eb')
	
	ctx.fillStyle = gradient
	ctx.fillRect(0, 0, width, height)
	
	return canvas.toDataURL('image/jpeg', 0.1)
}

// Hook para optimización de imágenes
export const useImageOptimizer = (config: ImageOptimizerConfig = {}) => {
	const {
		defaultQuality = 75,
		supportedFormats = ['avif', 'webp', 'jpg'],
		responsiveSizes = [640, 768, 1024, 1280, 1536],
		lazyThreshold = '100px',
		preloadCritical = true
	} = config

	const [formatSupport, setFormatSupport] = useState<{
		avif: boolean
		webp: boolean
	}>({ avif: false, webp: false })

	useEffect(() => {
		detectImageSupport().then(setFormatSupport)
	}, [])

	// Obtener el mejor formato soportado
	const getBestFormat = useCallback((): string => {
		for (const format of supportedFormats) {
			if (format === 'avif' && formatSupport.avif) return 'avif'
			if (format === 'webp' && formatSupport.webp) return 'webp'
		}
		return 'jpg'
	}, [supportedFormats, formatSupport])

	// Optimizar URL de imagen
	const optimizeImageUrl = useCallback((
		src: string,
		options: {
			width?: number
			height?: number
			quality?: number
			format?: string
		} = {}
	): string => {
		const {
			width,
			height,
			quality = defaultQuality,
			format = getBestFormat()
		} = options

		// Si es una URL externa, usar servicio de optimización
		if (src.startsWith('http')) {
			const params = new URLSearchParams()
			if (width) params.set('w', width.toString())
			if (height) params.set('h', height.toString())
			params.set('q', quality.toString())
			params.set('f', format)
			
			return `/_next/image?url=${encodeURIComponent(src)}&${params.toString()}`
		}

		// Para imágenes locales, usar Next.js Image Optimization
		const params = new URLSearchParams()
		if (width) params.set('w', width.toString())
		if (height) params.set('h', height.toString())
		params.set('q', quality.toString())
		
		const separator = src.includes('?') ? '&' : '?'
		return `${src}${separator}${params.toString()}`
	}, [defaultQuality, getBestFormat])

	return {
		optimizeImageUrl,
		generateSrcSet: (src: string, quality?: number) => 
			generateSrcSet(src, responsiveSizes, getBestFormat(), quality || defaultQuality),
		generateBlurPlaceholder,
		formatSupport,
		bestFormat: getBestFormat()
	}
}

// Hook para lazy loading de imágenes
export const useImageLazyLoading = (options: {
	threshold?: string
	rootMargin?: string
	enabled?: boolean
} = {}) => {
	const {
		threshold = '100px',
		rootMargin = '50px',
		enabled = true
	} = options

	const [isInView, setIsInView] = useState(false)
	const [hasLoaded, setHasLoaded] = useState(false)
	const elementRef = useRef<HTMLElement>(null)

	useEffect(() => {
		if (!enabled || hasLoaded || !elementRef.current) return

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach(entry => {
					if (entry.isIntersecting && !hasLoaded) {
						setIsInView(true)
						setHasLoaded(true)
						observer.unobserve(entry.target)
					}
				})
			},
			{ rootMargin }
		)

		observer.observe(elementRef.current)

		return () => {
			observer.disconnect()
		}
	}, [enabled, hasLoaded, rootMargin])

	return {
		elementRef,
		isInView,
		hasLoaded,
		shouldLoad: isInView || hasLoaded
	}
}

// Hook para estado de carga de imagen
export const useImageState = (src?: string) => {
	const [state, setState] = useState<ImageState>({
		isLoading: false,
		isLoaded: false,
		hasError: false
	})

	const handleLoadStart = useCallback(() => {
		setState(prev => ({
			...prev,
			isLoading: true,
			isLoaded: false,
			hasError: false,
			errorMessage: undefined
		}))
	}, [])

	const handleLoadSuccess = useCallback((currentSrc: string) => {
		setState(prev => ({
			...prev,
			isLoading: false,
			isLoaded: true,
			hasError: false,
			currentSrc,
			errorMessage: undefined
		}))
	}, [])

	const handleLoadError = useCallback((error: string) => {
		setState(prev => ({
			...prev,
			isLoading: false,
			isLoaded: false,
			hasError: true,
			errorMessage: error
		}))
	}, [])

	// Reset state when src changes
	useEffect(() => {
		if (src) {
			setState({
				isLoading: false,
				isLoaded: false,
				hasError: false
			})
		}
	}, [src])

	return {
		...state,
		handleLoadStart,
		handleLoadSuccess,
		handleLoadError
	}
}

// Utilidades para precargar imágenes
export const preloadImage = (src: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.onload = () => resolve()
		img.onerror = () => reject(new Error(`Failed to preload image: ${src}`))
		img.src = src
	})
}

export const preloadImages = async (sources: string[]): Promise<void> => {
	try {
		await Promise.all(sources.map(preloadImage))
		logger.info(`Precargadas ${sources.length} imágenes`, { count: sources.length }, 'IMAGE_OPTIMIZER')
	} catch (error) {
		logger.warn('Error precargando imágenes', error, 'IMAGE_OPTIMIZER')
	}
}

// Configuración por defecto del optimizador
export const defaultImageConfig: ImageOptimizerConfig = {
	defaultQuality: 75,
	supportedFormats: ['avif', 'webp', 'jpg'],
	responsiveSizes: [640, 768, 1024, 1280, 1536, 1920],
	lazyThreshold: '100px',
	preloadCritical: true
}

export default useImageOptimizer