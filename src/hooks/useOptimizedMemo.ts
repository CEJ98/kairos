import { useMemo, useRef, useCallback, useState, useEffect } from 'react';

// Función de comparación profunda nativa
function deepEqual(a: any, b: any): boolean {
	if (a === b) return true;
	if (a == null || b == null) return false;
	if (typeof a !== typeof b) return false;
	
	if (typeof a === 'object') {
		if (Array.isArray(a) !== Array.isArray(b)) return false;
		
		const keysA = Object.keys(a);
		const keysB = Object.keys(b);
		
		if (keysA.length !== keysB.length) return false;
		
		for (const key of keysA) {
			if (!keysB.includes(key)) return false;
			if (!deepEqual(a[key], b[key])) return false;
		}
		
		return true;
	}
	
	return false;
}

/**
 * Hook para memoización profunda usando comparación de igualdad
 * Útil cuando las dependencias son objetos o arrays complejos
 */
export function useDeepMemo<T>(factory: () => T, deps: React.DependencyList): T {
	const ref = useRef<{ deps: React.DependencyList; value: T }>();

	if (!ref.current || !deepEqual(ref.current.deps, deps)) {
		ref.current = {
			deps,
			value: factory()
		};
	}

	return ref.current.value;
}

/**
 * Hook para memoización de callbacks con comparación profunda
 */
export function useDeepCallback<T extends (...args: any[]) => any>(
	callback: T,
	deps: React.DependencyList
): T {
	return useDeepMemo(() => callback, deps);
}

/**
 * Hook para memoización con cache LRU (Least Recently Used)
 * Útil para funciones costosas que se llaman frecuentemente
 */
export function useLRUMemo<T>(
	factory: () => T,
	deps: React.DependencyList,
	maxSize: number = 10
): T {
	const cache = useRef<Map<string, { value: T; timestamp: number }>>(new Map());

	return useMemo(() => {
		const key = JSON.stringify(deps);
		const cached = cache.current.get(key);

		if (cached) {
			// Actualizar timestamp para LRU
			cached.timestamp = Date.now();
			return cached.value;
		}

		// Limpiar cache si excede el tamaño máximo
		if (cache.current.size >= maxSize) {
			const entries = Array.from(cache.current.entries());
			entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
			
			// Eliminar la mitad de las entradas más antiguas
			const toRemove = Math.floor(maxSize / 2);
			for (let i = 0; i < toRemove; i++) {
				cache.current.delete(entries[i][0]);
			}
		}

		const value = factory();
		cache.current.set(key, { value, timestamp: Date.now() });
		return value;
	}, [deps, factory, maxSize]);
}

/**
 * Hook para debounce de valores
 * Útil para optimizar búsquedas y filtros
 */
export function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
}

/**
 * Hook para throttle de funciones
 * Útil para eventos que se disparan frecuentemente (scroll, resize)
 */
export function useThrottle<T extends (...args: any[]) => any>(
	func: T,
	delay: number
): T {
	const lastRun = useRef<number>(0);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const throttledFunc = useCallback(
		(...args: Parameters<T>) => {
			const now = Date.now();

			if (now - lastRun.current >= delay) {
				func(...args);
				lastRun.current = now;
			} else {
				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
				}

				timeoutRef.current = setTimeout(() => {
					func(...args);
					lastRun.current = Date.now();
				}, delay - (now - lastRun.current));
			}
		},
		[func, delay]
	) as T;

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return throttledFunc;
}

/**
 * Hook para memoización selectiva basada en propiedades específicas
 * Útil cuando solo ciertas propiedades de un objeto deben disparar re-renders
 */
export function useSelectiveMemo<T, K extends keyof T>(
	obj: T,
	keys: K[]
): Pick<T, K> {
	return useMemo(() => {
		const result = {} as Pick<T, K>;
		keys.forEach(key => {
			result[key] = obj[key];
		});
		return result;
	}, [obj, keys]);
}

/**
 * Hook para memoización con invalidación manual
 * Útil cuando necesitas control manual sobre cuándo invalidar el cache
 */
export function useInvalidatableMemo<T>(
	factory: () => T,
	deps: React.DependencyList
): [T, () => void] {
	const [invalidateKey, setInvalidateKey] = useState(0);

	const value = useMemo(factory, [factory, ...deps, invalidateKey]);

	const invalidate = useCallback(() => {
		setInvalidateKey(prev => prev + 1);
	}, []);

	return [value, invalidate];
}

/**
 * Hook para memoización asíncrona
 * Útil para operaciones costosas que devuelven promesas
 */
export function useAsyncMemo<T>(
	factory: () => Promise<T>,
	deps: React.DependencyList,
	initialValue?: T
): { value: T | undefined; loading: boolean; error: Error | null } {
	const [state, setState] = useState<{
		value: T | undefined;
		loading: boolean;
		error: Error | null;
	}>({
		value: initialValue,
		loading: false,
		error: null
	});

	useEffect(() => {
		let cancelled = false;

		setState(prev => ({ ...prev, loading: true, error: null }));

		factory()
			.then(value => {
				if (!cancelled) {
					setState({ value, loading: false, error: null });
				}
			})
			.catch(error => {
				if (!cancelled) {
					setState(prev => ({ 
						...prev, 
						loading: false, 
						error: error instanceof Error ? error : new Error('Error desconocido')
					}));
				}
			});

		return () => {
			cancelled = true;
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [factory, ...deps]);

	return state;
}