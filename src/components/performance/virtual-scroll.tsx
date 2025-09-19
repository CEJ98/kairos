'use client';

import React, { useState, useEffect, useRef, useMemo, ReactNode } from 'react';

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  loading?: boolean;
  loadingComponent?: ReactNode;
  emptyComponent?: ReactNode;
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
  overscan = 5,
  onScroll,
  loading = false,
  loadingComponent,
  emptyComponent
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const visibleItemsCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    startIndex + visibleItemsCount + overscan * 2
  );

  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = startIndex; i <= endIndex; i++) {
      if (items[i]) {
        result.push({
          item: items[i],
          index: i,
          offsetY: i * itemHeight
        });
      }
    }
    return result;
  }, [items, startIndex, endIndex, itemHeight]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  };

  useEffect(() => {
    if (scrollElementRef.current) {
      scrollElementRef.current.scrollTop = scrollTop;
    }
  }, [scrollTop]);

  if (loading) {
    return (
      <div className={`${className}`} style={{ height: containerHeight }}>
        {loadingComponent || (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            <span className="ml-2">Cargando...</span>
          </div>
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`${className}`} style={{ height: containerHeight }}>
        {emptyComponent || (
          <div className="flex items-center justify-center h-full text-gray-500">
            No hay elementos para mostrar
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, offsetY }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: offsetY,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Hook para virtual scrolling con altura dinámica
interface UseVirtualScrollOptions {
  itemCount: number;
  estimatedItemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualScroll({
  itemCount,
  estimatedItemHeight,
  containerHeight,
  overscan = 5
}: UseVirtualScrollOptions) {
  const [scrollTop, setScrollTop] = useState(0);
  const [itemHeights, setItemHeights] = useState<number[]>([]);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const itemOffsets = useMemo(() => {
    const offsets = [0];
    for (let i = 1; i < itemCount; i++) {
      const height = itemHeights[i - 1] || estimatedItemHeight;
      offsets[i] = offsets[i - 1] + height;
    }
    return offsets;
  }, [itemHeights, itemCount, estimatedItemHeight]);

  const totalHeight = itemOffsets[itemCount - 1] + (itemHeights[itemCount - 1] || estimatedItemHeight);

  const getVisibleRange = () => {
    const start = Math.max(0, findStartIndex(itemOffsets, scrollTop) - overscan);
    const end = Math.min(
      itemCount - 1,
      findEndIndex(itemOffsets, itemHeights, scrollTop + containerHeight, estimatedItemHeight) + overscan
    );
    return { start, end };
  };

  const setItemHeight = (index: number, height: number) => {
    setItemHeights(prev => {
      const newHeights = [...prev];
      newHeights[index] = height;
      return newHeights;
    });
  };

  const scrollToIndex = (index: number) => {
    if (scrollElementRef.current && itemOffsets[index] !== undefined) {
      scrollElementRef.current.scrollTop = itemOffsets[index];
    }
  };

  return {
    scrollTop,
    setScrollTop,
    totalHeight,
    getVisibleRange,
    setItemHeight,
    scrollToIndex,
    scrollElementRef
  };
}

// Utilidades para búsqueda binaria
function findStartIndex(offsets: number[], scrollTop: number): number {
  let start = 0;
  let end = offsets.length - 1;
  
  while (start <= end) {
    const mid = Math.floor((start + end) / 2);
    if (offsets[mid] < scrollTop) {
      start = mid + 1;
    } else {
      end = mid - 1;
    }
  }
  
  return Math.max(0, end);
}

function findEndIndex(
  offsets: number[], 
  heights: number[], 
  scrollBottom: number, 
  estimatedHeight: number
): number {
  let start = 0;
  let end = offsets.length - 1;
  
  while (start <= end) {
    const mid = Math.floor((start + end) / 2);
    const itemBottom = offsets[mid] + (heights[mid] || estimatedHeight);
    
    if (itemBottom < scrollBottom) {
      start = mid + 1;
    } else {
      end = mid - 1;
    }
  }
  
  return Math.min(offsets.length - 1, start);
}

// Componente de lista virtual con altura dinámica
interface DynamicVirtualListProps<T> {
  items: T[];
  estimatedItemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number, setHeight: (height: number) => void) => ReactNode;
  className?: string;
  overscan?: number;
}

export function DynamicVirtualList<T>({
  items,
  estimatedItemHeight,
  containerHeight,
  renderItem,
  className = '',
  overscan = 5
}: DynamicVirtualListProps<T>) {
  const {
    scrollTop,
    setScrollTop,
    totalHeight,
    getVisibleRange,
    setItemHeight,
    scrollElementRef
  } = useVirtualScroll({
    itemCount: items.length,
    estimatedItemHeight,
    containerHeight,
    overscan
  });

  const { start, end } = getVisibleRange();
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    // Medir alturas de elementos visibles
    itemRefs.current.forEach((element, index) => {
      if (element) {
        const height = element.getBoundingClientRect().height;
        setItemHeight(index, height);
      }
    });
  }, [items, setItemHeight]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const setRef = (index: number) => (element: HTMLDivElement | null) => {
    if (element) {
      itemRefs.current.set(index, element);
    } else {
      itemRefs.current.delete(index);
    }
  };

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {Array.from({ length: end - start + 1 }, (_, i) => {
          const index = start + i;
          const item = items[index];
          if (!item) return null;

          return (
            <div
              key={index}
              ref={setRef(index)}
              style={{
                position: 'absolute',
                top: 0, // Se calculará dinámicamente
                left: 0,
                right: 0
              }}
            >
              {renderItem(item, index, (height) => setItemHeight(index, height))}
            </div>
          );
        })}
      </div>
    </div>
  );
}