'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useResponsive } from './useResponsive';

interface SmartImageOptions {
	src: string;
	alt: string;
	width?: number;
	height?: number;
	quality?: number;
	priority?: boolean;
	placeholder?: 'blur' | 'empty';
	blurDataURL?: string;
	sizes?: string;
	optimizeForDevice?: boolean;
	enableProgressiveLoading?: boolean;
	preloadStrategy?: 'none' | 'viewport' | 'hover' | 'immediate';
}

interface SmartImageState {
	isLoading: boolean;
	isLoaded: boolean;
	hasError: boolean;
	optimizedSrc: string;
	optimizedSizes: string;
	blurDataURL?: string;
	progress: number;
}

interface ImageFormat {
	format: string;
	mimeType: string;
	supported: boolean;
	quality: number;
}

// Detectar soporte de formatos modernos
const detectFormatSupport = (): Promise<ImageFormat[]> => {
	return new Promise((resolve) => {
		const formats: ImageFormat[] = [
			{ format: 'avif', mimeType: 'image/avif', supported: false, quality: 50 },
			{ format: 'webp', mimeType: 'image/webp', supported: false, quality: 75 },
			{ format: 'jpeg', mimeType: 'image/jpeg', supported: true, quality: 85 }
		];

		const checkFormat = (format: ImageFormat): Promise<boolean> => {
			return new Promise((resolve) => {
				const img = new Image();
				img.onload = () => resolve(img.width === 1 && img.height === 1);
				img.onerror = () => resolve(false);
				
				switch (format.format) {
					case 'avif':
						img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
						break;
					case 'webp':
						img.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
						break;
					default:
						resolve(true);
				}
			});
		};

		Promise.all(formats.map(async (format) => {
			format.supported = await checkFormat(format);
			return format;
		})).then(resolve);
	});
};

// Generar srcSet optimizado
const generateOptimizedSrcSet = (
	src: string, 
	width: number, 
	height: number, 
	format: string,
	quality: number,
	breakpoints: number[]
): string => {
	return breakpoints
		.map(bp => {
			const scaledWidth = Math.round(width * (bp / 1920)); // Base 1920px
			const scaledHeight = Math.round(height * (bp / 1920));
			return `/_next/image?url=${encodeURIComponent(src)}&w=${scaledWidth}&h=${scaledHeight}&q=${quality}&f=${format} ${bp}w`;
		})
		.join(', ');
};

// Generar placeholder blur
const generateBlurDataURL = (width: number, height: number): string => {
	const canvas = document.createElement('canvas');
	canvas.width = 10;
	canvas.height = Math.round((height / width) * 10);
	
	const ctx = canvas.getContext('2d');
	if (!ctx) return '';
	
	// Gradiente simple como placeholder
	const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
	gradient.addColorStop(0, '#f3f4f6');
	gradient.addColorStop(1, '#e5e7eb');
	
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	return canvas.toDataURL('image/jpeg', 0.1);
};

export const useSmartImage = (options: SmartImageOptions): SmartImageState => {
	const { isMobile } = useResponsive();
	const [state, setState] = useState<SmartImageState>({
		isLoading: true,
		isLoaded: false,
		hasError: false,
		optimizedSrc: options.src,
		optimizedSizes: options.sizes || '100vw',
		blurDataURL: options.blurDataURL,
		progress: 0
	});
	
	const [supportedFormats, setSupportedFormats] = useState<ImageFormat[]>([]);
	const imgRef = useRef<HTMLImageElement | null>(null);
	const observerRef = useRef<IntersectionObserver | null>(null);

	// Detectar formatos soportados al montar
	useEffect(() => {
		detectFormatSupport().then(setSupportedFormats);
	}, []);

	// Optimizar imagen basado en dispositivo y formatos soportados
	const optimizeImage = useCallback(() => {
		if (supportedFormats.length === 0) return;

		const bestFormat = supportedFormats.find(f => f.supported) || supportedFormats[supportedFormats.length - 1];
		const deviceWidth = options.width || (isMobile ? 768 : 1920);
		const deviceHeight = options.height || Math.round(deviceWidth * 0.6);
		const quality = options.quality || bestFormat.quality;

		// Breakpoints adaptativos
		const breakpoints = isMobile 
			? [320, 480, 768] 
			: [768, 1024, 1280, 1536, 1920];

		const optimizedSrc = `/_next/image?url=${encodeURIComponent(options.src)}&w=${deviceWidth}&h=${deviceHeight}&q=${quality}&f=${bestFormat.format}`;
		const srcSet = generateOptimizedSrcSet(options.src, deviceWidth, deviceHeight, bestFormat.format, quality, breakpoints);
		
		// Generar blur placeholder si no se proporciona
		const blurDataURL = options.blurDataURL || 
			(options.placeholder === 'blur' ? generateBlurDataURL(deviceWidth, deviceHeight) : undefined);

		const sizes = options.sizes || (
			isMobile 
				? '(max-width: 768px) 100vw, 768px'
				: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
		);

		setState(prev => ({
			...prev,
			optimizedSrc,
			optimizedSizes: sizes,
			blurDataURL
		}));
	}, [supportedFormats, isMobile, options]);

	// Preload strategy
	const handlePreload = useCallback(() => {
		if (options.preloadStrategy === 'immediate' || options.priority) {
			const link = document.createElement('link');
			link.rel = 'preload';
			link.as = 'image';
			link.href = state.optimizedSrc;
			document.head.appendChild(link);
		}
	}, [options.preloadStrategy, options.priority, state.optimizedSrc]);

	// Intersection Observer para lazy loading
	useEffect(() => {
		if (options.preloadStrategy === 'viewport' && imgRef.current) {
			observerRef.current = new IntersectionObserver(
				(entries) => {
					entries.forEach(entry => {
						if (entry.isIntersecting) {
							handlePreload();
							observerRef.current?.unobserve(entry.target);
						}
					});
				},
				{ rootMargin: '50px' }
			);

			observerRef.current.observe(imgRef.current);
		}

		return () => {
			observerRef.current?.disconnect();
		};
	}, [options.preloadStrategy, handlePreload]);

	// Simular progreso de carga para UX mejorada
	useEffect(() => {
		if (state.isLoading && options.enableProgressiveLoading) {
			const interval = setInterval(() => {
				setState(prev => {
					if (prev.progress >= 90) {
						clearInterval(interval);
						return prev;
					}
					return { ...prev, progress: prev.progress + Math.random() * 20 };
				});
			}, 100);

			return () => clearInterval(interval);
		}
	}, [state.isLoading, options.enableProgressiveLoading]);

	// Optimizar cuando cambien las dependencias
	useEffect(() => {
		optimizeImage();
	}, [optimizeImage]);

	// Manejar eventos de carga
	useEffect(() => {
		const img = new Image();
		
		img.onload = () => {
			setState(prev => ({
				...prev,
				isLoading: false,
				isLoaded: true,
				hasError: false,
				progress: 100
			}));
		};

		img.onerror = () => {
			setState(prev => ({
				...prev,
				isLoading: false,
				isLoaded: false,
				hasError: true,
				progress: 0
			}));
		};

		img.src = state.optimizedSrc;
		imgRef.current = img;

		return () => {
			img.onload = null;
			img.onerror = null;
		};
	}, [state.optimizedSrc]);

	return state;
};

// Hook simplificado para casos comunes
export const useOptimizedImage = (src: string, alt: string, options?: Partial<SmartImageOptions>) => {
	return useSmartImage({
		src,
		alt,
		optimizeForDevice: true,
		enableProgressiveLoading: true,
		preloadStrategy: 'viewport',
		placeholder: 'blur',
		...options
	});
};