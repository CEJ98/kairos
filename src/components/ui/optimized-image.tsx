'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { 
	useImageOptimizer, 
	useImageLazyLoading, 
	useImageState,
	defaultImageConfig
} from '@/lib/image-optimizer'

interface OptimizedImageProps {
	src: string
	alt: string
	width?: number
	height?: number
	className?: string
	sizes?: string
	quality?: number
	priority?: boolean
	placeholder?: 'blur' | 'empty'
	blurDataURL?: string
	fill?: boolean
	lazy?: boolean
	optimize?: boolean
	onLoad?: () => void
	onError?: (error: Error) => void
}

// Componente de placeholder para carga
const ImagePlaceholder = ({ 
	width, 
	height, 
	className 
}: { 
	width?: number
	height?: number
	className?: string 
}) => (
	<div 
		className={cn(
			'bg-muted animate-pulse flex items-center justify-center',
			className
		)}
		style={{ width, height }}
	>
		<svg 
			className="w-8 h-8 text-muted-foreground" 
			fill="currentColor" 
			viewBox="0 0 20 20"
		>
			<path 
				fillRule="evenodd" 
				d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" 
				clipRule="evenodd" 
			/>
		</svg>
	</div>
)

// Componente de error para imágenes
const ImageError = ({ 
	width, 
	height, 
	className,
	alt 
}: { 
	width?: number
	height?: number
	className?: string
	alt: string
}) => (
	<div 
		className={cn(
			'bg-muted border border-border flex items-center justify-center text-muted-foreground',
			className
		)}
		style={{ width, height }}
		title={`Error cargando imagen: ${alt}`}
	>
		<svg 
			className="w-6 h-6" 
			fill="currentColor" 
			viewBox="0 0 20 20"
		>
			<path 
				fillRule="evenodd" 
				d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
				clipRule="evenodd" 
			/>
		</svg>
	</div>
)

const OptimizedImage = ({
	src,
	alt,
	width,
	height,
	className,
	quality = 75,
	priority = false,
	placeholder = 'empty',
	blurDataURL,
	sizes,
	fill = false,
	lazy = true,
	optimize = true,
	onLoad,
	onError
}: OptimizedImageProps) => {
	// Hooks para optimización y lazy loading
	const { optimizeImageUrl, generateSrcSet, generateBlurPlaceholder, bestFormat } = useImageOptimizer()
	const { elementRef, shouldLoad } = useImageLazyLoading({ 
		enabled: lazy && !priority 
	})
	const { 
		isLoading, 
		isLoaded, 
		hasError, 
		handleLoadStart, 
		handleLoadSuccess, 
		handleLoadError 
	} = useImageState(src)

	// Optimizar URL de imagen si está habilitado
	const optimizedSrc = optimize ? optimizeImageUrl(src, {
		width,
		height,
		quality
	}) : src

	// Generar srcSet para imágenes responsivas
	const srcSet = optimize && !fill ? generateSrcSet(src, quality) : undefined

	// Generar blur placeholder automático
	const autoBlurDataURL = placeholder === 'blur' && !blurDataURL && width && height 
		? generateBlurPlaceholder(Math.min(width, 40), Math.min(height, 40))
		: blurDataURL

	// Determinar si debe cargar la imagen
	const shouldLoadImage = priority || shouldLoad

	// Handlers de eventos
	const handleImageLoad = useCallback(() => {
		handleLoadSuccess(optimizedSrc)
		onLoad?.()
	}, [handleLoadSuccess, optimizedSrc, onLoad])

	const handleImageError = useCallback(() => {
		const error = new Error(`Failed to load image: ${src}`)
		handleLoadError(error.message)
		onError?.(error)
	}, [handleLoadError, src, onError])

	// Iniciar carga cuando sea necesario
	useEffect(() => {
		if (shouldLoadImage && !isLoaded && !hasError) {
			handleLoadStart()
		}
	}, [shouldLoadImage, isLoaded, hasError, handleLoadStart])

	const containerStyle = {
		width: fill ? '100%' : width,
		height: fill ? '100%' : height,
		position: fill ? 'relative' as const : undefined
	}

	return (
		<div 
			ref={elementRef as React.RefObject<HTMLDivElement>}
			className={cn('relative overflow-hidden', className)}
			style={containerStyle}
		>
			{/* Placeholder de carga */}
			{isLoading && (
				<ImagePlaceholder 
					width={width} 
					height={height} 
					className="absolute inset-0" 
				/>
			)}

			{/* Estado de error */}
			{hasError && (
				<ImageError 
					width={width} 
					height={height} 
					alt={alt}
					className="absolute inset-0" 
				/>
			)}

			{/* Imagen optimizada */}
			{shouldLoadImage && !hasError && (
				<Image
					src={optimizedSrc}
					alt={alt}
					width={fill ? undefined : width}
					height={fill ? undefined : height}
					fill={fill}
					quality={quality}
					sizes={sizes}
					priority={priority}
					placeholder={placeholder}
					blurDataURL={autoBlurDataURL}
					className={cn(
						'transition-opacity duration-300 ease-in-out',
						isLoaded ? 'opacity-100' : 'opacity-0'
					)}
					onLoad={handleImageLoad}
					onError={handleImageError}
				/>
			)}
		</div>
	)
}

// Hook para precargar imágenes
export const useImagePreloader = () => {
	const preloadImage = (src: string): Promise<void> => {
		return new Promise((resolve, reject) => {
			const img = new window.Image()
			img.onload = () => resolve()
			img.onerror = reject
			img.src = src
		})
	}

	const preloadImages = async (sources: string[]): Promise<void[]> => {
		return Promise.all(sources.map(preloadImage))
	}

	return { preloadImage, preloadImages }
}

// Utilidad para generar placeholder blur data URL
export const generateBlurDataURL = (width: number, height: number, color = '#f3f4f6'): string => {
	const svg = `
		<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
			<rect width="100%" height="100%" fill="${color}"/>
		</svg>
	`
	return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

export default OptimizedImage