'use client';

import React, { forwardRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useSmartImage } from '@/hooks/useSmartImage';
import { Progress } from '@/components/ui/progress';
import { ImageIcon, AlertCircle } from 'lucide-react';

interface SmartImageProps {
	src: string;
	alt: string;
	width?: number;
	height?: number;
	quality?: number;
	priority?: boolean;
	placeholder?: 'blur' | 'empty';
	blurDataURL?: string;
	sizes?: string;
	className?: string;
	optimizeForDevice?: boolean;
	enableProgressiveLoading?: boolean;
	preloadStrategy?: 'none' | 'viewport' | 'hover' | 'immediate';
	showProgress?: boolean;
	fallbackSrc?: string;
	onLoad?: () => void;
	onError?: () => void;
}

const SmartImage = forwardRef<HTMLDivElement, SmartImageProps>((
	{
		src,
		alt,
		width,
		height,
		quality = 75,
		priority = false,
		placeholder = 'blur',
		blurDataURL,
		sizes,
		className,
		optimizeForDevice = true,
		enableProgressiveLoading = true,
		preloadStrategy = 'viewport',
		showProgress = false,
		fallbackSrc,
		onLoad,
		onError,
		...props
	},
	ref
) => {
	const imageState = useSmartImage({
		src,
		alt,
		width,
		height,
		quality,
		priority,
		placeholder,
		blurDataURL,
		sizes,
		optimizeForDevice,
		enableProgressiveLoading,
		preloadStrategy
	});

	const {
		isLoading,
		isLoaded,
		hasError,
		optimizedSrc,
		optimizedSizes,
		blurDataURL: generatedBlurDataURL,
		progress
	} = imageState;

	// Manejar eventos
	React.useEffect(() => {
		if (isLoaded && onLoad) {
			onLoad();
		}
		if (hasError && onError) {
			onError();
		}
	}, [isLoaded, hasError, onLoad, onError]);

	// Renderizar estado de error
	if (hasError) {
		return (
			<div 
				ref={ref}
				className={cn(
					'flex items-center justify-center bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25',
					className
				)}
				style={{ width, height }}
				{...props}
			>
				<div className="flex flex-col items-center gap-2 text-muted-foreground">
					<AlertCircle className="h-8 w-8" />
					<span className="text-sm">Error al cargar imagen</span>
					{fallbackSrc && (
						<Image
							src={fallbackSrc}
							alt={alt}
							width={width}
							height={height}
							className="rounded opacity-50"
						/>
					)}
				</div>
			</div>
		);
	}

	// Renderizar estado de carga
	if (isLoading) {
		return (
			<div 
				ref={ref}
				className={cn(
					'relative flex items-center justify-center bg-muted rounded-lg overflow-hidden',
					className
				)}
				style={{ width, height }}
				{...props}
			>
				{/* Placeholder blur si está disponible */}
				{generatedBlurDataURL && (
					<Image
						src={generatedBlurDataURL}
						alt=""
						fill
						className="object-cover blur-sm scale-110"
						aria-hidden="true"
					/>
				)}
				
				{/* Overlay de carga */}
				<div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm">
					<div className="flex flex-col items-center gap-3">
						<ImageIcon className="h-8 w-8 text-muted-foreground animate-pulse" />
						
						{showProgress && enableProgressiveLoading && (
							<div className="w-24 space-y-1">
								<Progress value={progress} className="h-1" />
								<span className="text-xs text-muted-foreground text-center block">
									{Math.round(progress)}%
								</span>
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}

	// Renderizar imagen optimizada
	return (
		<div 
			ref={ref}
			className={cn('relative overflow-hidden', className)}
			{...props}
		>
			<Image
				src={optimizedSrc}
				alt={alt}
				width={width}
				height={height}
				quality={quality}
				priority={priority}
				placeholder={placeholder}
				blurDataURL={generatedBlurDataURL}
				sizes={optimizedSizes}
				className={cn(
					'transition-opacity duration-300',
					isLoaded ? 'opacity-100' : 'opacity-0'
				)}
				style={{
					width: width ? `${width}px` : '100%',
					height: height ? `${height}px` : 'auto'
				}}
			/>
			
			{/* Indicador de carga completada */}
			{isLoaded && (
				<div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
					<div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
						<div className="w-2 h-2 bg-white rounded-full" />
						Optimizada
					</div>
				</div>
			)}
		</div>
	);
});

SmartImage.displayName = 'SmartImage';

export { SmartImage };
export type { SmartImageProps };