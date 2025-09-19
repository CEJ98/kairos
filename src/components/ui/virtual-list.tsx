'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useDeepMemo } from '@/hooks/useOptimizedMemo';

interface VirtualListProps<T> {
	items: T[];
	itemHeight: number | ((index: number, item: T) => number);
	height: number;
	renderItem: (item: T, index: number, isVisible: boolean) => React.ReactNode;
	overscan?: number;
	className?: string;
	containerClassName?: string;
	onScroll?: (scrollTop: number, scrollLeft: number) => void;
	onItemsRendered?: (startIndex: number, endIndex: number) => void;
	getItemKey?: (item: T, index: number) => string | number;
	scrollToIndex?: number;
	scrollToAlignment?: 'start' | 'center' | 'end' | 'auto';
}

interface VirtualGridProps<T> {
	items: T[];
	itemWidth: number;
	itemHeight: number;
	columns: number;
	height: number;
	renderItem: (item: T, index: number, isVisible: boolean) => React.ReactNode;
	overscan?: number;
	className?: string;
	containerClassName?: string;
	onScroll?: (scrollTop: number, scrollLeft: number) => void;
	getItemKey?: (item: T, index: number) => string | number;
}

// Hook para calcular elementos visibles
function useVirtualization<T>({
	items,
	itemHeight,
	height,
	overscan = 5,
	scrollTop = 0
}: {
	items: T[];
	itemHeight: number | ((index: number, item: T) => number);
	height: number;
	overscan?: number;
	scrollTop?: number;
}) {
	return useDeepMemo(() => {
		if (items.length === 0) {
			return {
				visibleItems: [],
				startIndex: 0,
				endIndex: 0,
				totalHeight: 0,
				offsetY: 0
			};
		}

		let totalHeight = 0;
		const itemHeights: number[] = [];
		const itemOffsets: number[] = [];

		// Calcular alturas y offsets
		for (let i = 0; i < items.length; i++) {
			const currentHeight = typeof itemHeight === 'function' 
				? itemHeight(i, items[i]) 
				: itemHeight;
			
			itemOffsets[i] = totalHeight;
			itemHeights[i] = currentHeight;
			totalHeight += currentHeight;
		}

		// Encontrar el rango visible
		let startIndex = 0;
		let endIndex = items.length - 1;

		// Buscar el primer elemento visible
		for (let i = 0; i < items.length; i++) {
			if (itemOffsets[i] + itemHeights[i] > scrollTop) {
				startIndex = Math.max(0, i - overscan);
				break;
			}
		}

		// Buscar el último elemento visible
		for (let i = startIndex; i < items.length; i++) {
			if (itemOffsets[i] > scrollTop + height) {
				endIndex = Math.min(items.length - 1, i + overscan);
				break;
			}
		}

		const visibleItems = items.slice(startIndex, endIndex + 1);
		const offsetY = startIndex > 0 ? itemOffsets[startIndex] : 0;

		return {
			visibleItems,
			startIndex,
			endIndex,
			totalHeight,
			offsetY,
			itemOffsets,
			itemHeights
		};
	}, [items, itemHeight, height, overscan, scrollTop]);
}

// Componente de lista virtual
export function VirtualList<T>({
	items,
	itemHeight,
	height,
	renderItem,
	overscan = 5,
	className,
	containerClassName,
	onScroll,
	onItemsRendered,
	getItemKey,
	scrollToIndex,
	scrollToAlignment = 'start'
}: VirtualListProps<T>) {
	const [scrollTop, setScrollTop] = useState(0);
	const containerRef = useRef<HTMLDivElement>(null);
	const isScrollingRef = useRef(false);
	const scrollTimeoutRef = useRef<NodeJS.Timeout>();

	const virtualization = useVirtualization({
		items,
		itemHeight,
		height,
		overscan,
		scrollTop
	});

	const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
		const newScrollTop = e.currentTarget.scrollTop;
		const newScrollLeft = e.currentTarget.scrollLeft;
		
		setScrollTop(newScrollTop);
		onScroll?.(newScrollTop, newScrollLeft);
		
		// Marcar como scrolling
		isScrollingRef.current = true;
		
		// Limpiar timeout anterior
		if (scrollTimeoutRef.current) {
			clearTimeout(scrollTimeoutRef.current);
		}
		
		// Marcar como no scrolling después de un delay
		scrollTimeoutRef.current = setTimeout(() => {
			isScrollingRef.current = false;
		}, 150);
	}, [onScroll]);

	// Scroll programático
	useEffect(() => {
		if (scrollToIndex !== undefined && containerRef.current && virtualization.itemOffsets) {
			const targetOffset = virtualization.itemOffsets[scrollToIndex];
			let scrollPosition = targetOffset;

			if (scrollToAlignment === 'center') {
				scrollPosition = targetOffset - height / 2 + (virtualization.itemHeights?.[scrollToIndex] || 0) / 2;
			} else if (scrollToAlignment === 'end') {
				scrollPosition = targetOffset - height + (virtualization.itemHeights?.[scrollToIndex] || 0);
			}

			containerRef.current.scrollTop = Math.max(0, scrollPosition);
		}
	}, [scrollToIndex, scrollToAlignment, height, virtualization.itemOffsets, virtualization.itemHeights]);

	// Notificar elementos renderizados
	useEffect(() => {
		onItemsRendered?.(virtualization.startIndex, virtualization.endIndex);
	}, [virtualization.startIndex, virtualization.endIndex, onItemsRendered]);

	return (
		<div
			ref={containerRef}
			className={cn(
				'overflow-auto',
				containerClassName
			)}
			style={{ height }}
			onScroll={handleScroll}
		>
			<div
				className={cn('relative', className)}
				style={{ height: virtualization.totalHeight }}
			>
				<div
					style={{
						transform: `translateY(${virtualization.offsetY}px)`,
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0
					}}
				>
					{virtualization.visibleItems.map((item, index) => {
						const actualIndex = virtualization.startIndex + index;
						const key = getItemKey ? getItemKey(item, actualIndex) : actualIndex;
						const isVisible = !isScrollingRef.current;

						return (
							<div key={key} style={{ 
								height: typeof itemHeight === 'function' 
									? itemHeight(actualIndex, item) 
									: itemHeight 
							}}>
								{renderItem(item, actualIndex, isVisible)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

// Componente de grid virtual
export function VirtualGrid<T>({
	items,
	itemWidth,
	itemHeight,
	columns,
	height,
	renderItem,
	overscan = 5,
	className,
	containerClassName,
	onScroll,
	getItemKey
}: VirtualGridProps<T>) {
	const [scrollTop, setScrollTop] = useState(0);
	const containerRef = useRef<HTMLDivElement>(null);

	const virtualization = useMemo(() => {
		const rows = Math.ceil(items.length / columns);
		const totalHeight = rows * itemHeight;

		const startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
		const endRow = Math.min(rows - 1, Math.ceil((scrollTop + height) / itemHeight) + overscan);

		const startIndex = startRow * columns;
		const endIndex = Math.min(items.length - 1, (endRow + 1) * columns - 1);

		const visibleItems = items.slice(startIndex, endIndex + 1);
		const offsetY = startRow * itemHeight;

		return {
			visibleItems,
			startIndex,
			endIndex,
			startRow,
			endRow,
			totalHeight,
			offsetY,
			rows
		};
	}, [items, columns, itemHeight, height, scrollTop, overscan]);

	const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
		const newScrollTop = e.currentTarget.scrollTop;
		const newScrollLeft = e.currentTarget.scrollLeft;
		
		setScrollTop(newScrollTop);
		onScroll?.(newScrollTop, newScrollLeft);
	}, [onScroll]);

	return (
		<div
			ref={containerRef}
			className={cn(
				'overflow-auto',
				containerClassName
			)}
			style={{ height }}
			onScroll={handleScroll}
		>
			<div
				className={cn('relative', className)}
				style={{ height: virtualization.totalHeight }}
			>
				<div
					style={{
						transform: `translateY(${virtualization.offsetY}px)`,
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						display: 'grid',
						gridTemplateColumns: `repeat(${columns}, ${itemWidth}px)`,
						gap: '8px'
					}}
				>
					{virtualization.visibleItems.map((item, index) => {
						const actualIndex = virtualization.startIndex + index;
						const key = getItemKey ? getItemKey(item, actualIndex) : actualIndex;

						return (
							<div 
								key={key} 
								style={{ 
									width: itemWidth, 
									height: itemHeight 
								}}
							>
								{renderItem(item, actualIndex, true)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

// Hook para scroll infinito
export function useInfiniteScroll({
	hasNextPage,
	isFetchingNextPage,
	fetchNextPage,
	threshold = 300
}: {
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
	fetchNextPage: () => void;
	threshold?: number;
}) {
	const handleScroll = useCallback((scrollTop: number, containerHeight: number, totalHeight: number) => {
		const distanceFromBottom = totalHeight - (scrollTop + containerHeight);
		
		if (
			distanceFromBottom < threshold &&
			hasNextPage &&
			!isFetchingNextPage
		) {
			fetchNextPage();
		}
	}, [hasNextPage, isFetchingNextPage, fetchNextPage, threshold]);

	return { handleScroll };
}

export type { VirtualListProps, VirtualGridProps };