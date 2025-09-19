import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLazyLoadOptions {
	root?: Element | null;
	rootMargin?: string;
	threshold?: number | number[];
	enabled?: boolean;
}

interface UseLazyLoadReturn {
	ref: React.RefObject<HTMLElement>;
	isIntersecting: boolean;
	isLoaded: boolean;
	load: () => void;
}

/**
 * Hook para lazy loading de componentes usando Intersection Observer
 * @param options Opciones de configuración para el Intersection Observer
 * @returns Objeto con ref, estado de intersección y funciones de control
 */
export function useLazyLoad(options: UseLazyLoadOptions = {}): UseLazyLoadReturn {
	const {
		root = null,
		rootMargin = '50px',
		threshold = 0.1,
		enabled = true
	} = options;

	const [isIntersecting, setIsIntersecting] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);
	const ref = useRef<HTMLElement>(null);
	const observerRef = useRef<IntersectionObserver | null>(null);

	const load = useCallback(() => {
		setIsLoaded(true);
	}, []);

	useEffect(() => {
		if (!enabled || !ref.current) return;

		// Si ya está cargado, no necesitamos observar
		if (isLoaded) {
			if (observerRef.current) {
				observerRef.current.disconnect();
				observerRef.current = null;
			}
			return;
		}

		// Crear el observer
		observerRef.current = new IntersectionObserver(
			([entry]) => {
				setIsIntersecting(entry.isIntersecting);
				
				// Auto-load cuando entra en el viewport
				if (entry.isIntersecting && !isLoaded) {
					setIsLoaded(true);
				}
			},
			{
				root,
				rootMargin,
				threshold
			}
		);

		// Observar el elemento
		if (ref.current) {
			observerRef.current.observe(ref.current);
		}

		// Cleanup
		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect();
				observerRef.current = null;
			}
		};
	}, [enabled, isLoaded, root, rootMargin, threshold]);

	// Cleanup al desmontar
	useEffect(() => {
		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect();
			}
		};
	}, []);

	return {
		ref,
		isIntersecting,
		isLoaded,
		load
	};
}

/**
 * Hook para lazy loading de imágenes
 * @param src URL de la imagen
 * @param options Opciones de configuración
 * @returns Objeto con props para la imagen y estado de carga
 */
export function useLazyImage(
	src: string,
	options: UseLazyLoadOptions & { placeholder?: string } = {}
) {
	const { placeholder, ...lazyOptions } = options;
	const { ref, isLoaded, load } = useLazyLoad(lazyOptions);
	const [imageSrc, setImageSrc] = useState(placeholder || '');
	const [imageLoaded, setImageLoaded] = useState(false);
	const [imageError, setImageError] = useState(false);

	useEffect(() => {
		if (isLoaded && src && !imageLoaded && !imageError) {
			const img = new Image();
			
			img.onload = () => {
				setImageSrc(src);
				setImageLoaded(true);
			};
			
			img.onerror = () => {
				setImageError(true);
			};
			
			img.src = src;
		}
	}, [isLoaded, src, imageLoaded, imageError]);

	return {
		ref,
		src: imageSrc,
		isLoaded: imageLoaded,
		isError: imageError,
		load
	};
}

/**
 * Hook para lazy loading de datos
 * @param fetchFn Función para obtener los datos
 * @param options Opciones de configuración
 * @returns Objeto con estado de los datos y funciones de control
 */
export function useLazyData<T>(
	fetchFn: () => Promise<T>,
	options: UseLazyLoadOptions & { 
		initialData?: T;
		refetchOnIntersect?: boolean;
	} = {}
) {
	const { initialData, refetchOnIntersect = false, ...lazyOptions } = options;
	const { ref, isIntersecting, isLoaded } = useLazyLoad(lazyOptions);
	const [data, setData] = useState<T | undefined>(initialData);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const hasFetched = useRef(false);

	const fetchData = useCallback(async () => {
		if (loading) return;
		
		setLoading(true);
		setError(null);
		
		try {
			const result = await fetchFn();
			setData(result);
			hasFetched.current = true;
		} catch (err) {
			setError(err instanceof Error ? err : new Error('Error desconocido'));
		} finally {
			setLoading(false);
		}
	}, [fetchFn, loading]);

	useEffect(() => {
		if (isLoaded && (!hasFetched.current || (refetchOnIntersect && isIntersecting))) {
			fetchData();
		}
	}, [isLoaded, isIntersecting, refetchOnIntersect, fetchData]);

	return {
		ref,
		data,
		loading,
		error,
		refetch: fetchData,
		isIntersecting
	};
}