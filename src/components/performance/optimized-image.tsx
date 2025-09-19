'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useIntersectionObserver } from '@/hooks/usePerformanceOptimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  quality?: number;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 75,
  loading = 'lazy',
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(priority);
  const imageRef = useRef<HTMLDivElement>(null);
  
  const { isIntersecting, setElement } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  });
  
  useEffect(() => {
    if (imageRef.current) {
      setElement(imageRef.current);
    }
  }, [setElement]);

  useEffect(() => {
    if (isIntersecting && !priority) {
      setShouldLoad(true);
    }
  }, [isIntersecting, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const generateBlurDataURL = (w: number, h: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, w, h);
    }
    return canvas.toDataURL();
  };

  const defaultBlurDataURL = blurDataURL || (width && height ? generateBlurDataURL(width, height) : undefined);

  if (hasError) {
    return (
      <div 
        ref={imageRef}
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500 text-sm">Error al cargar imagen</span>
      </div>
    );
  }

  return (
    <div ref={imageRef} className={`relative overflow-hidden ${className}`}>
      {shouldLoad ? (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={defaultBlurDataURL}
          sizes={sizes}
          quality={quality}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            objectFit: 'cover',
            width: '100%',
            height: 'auto'
          }}
        />
      ) : (
        <div 
          className="bg-gray-200 animate-pulse"
          style={{ width, height }}
        />
      )}
      
      {/* Loading overlay */}
      {shouldLoad && !isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
}

// Hook para precargar imágenes críticas
export function useImagePreloader(images: string[]) {
  useEffect(() => {
    const preloadImages = images.map(src => {
      const img = new window.Image();
      img.src = src;
      return img;
    });

    return () => {
      preloadImages.forEach(img => {
        img.src = '';
      });
    };
  }, [images]);
}

// Componente para galería optimizada
interface OptimizedGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
  className?: string;
  itemClassName?: string;
  priority?: number; // Número de imágenes a cargar con prioridad
}

export function OptimizedGallery({
  images,
  className = '',
  itemClassName = '',
  priority = 3
}: OptimizedGalleryProps) {
  return (
    <div className={`grid gap-4 ${className}`}>
      {images.map((image, index) => (
        <OptimizedImage
          key={`${image.src}-${index}`}
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          className={itemClassName}
          priority={index < priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ))}
    </div>
  );
}