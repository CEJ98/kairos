'use client';

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/useResponsive';

// Tipos para breakpoints
type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type GridCols = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

interface ResponsiveGridProps {
	children: React.ReactNode;
	cols?: Partial<Record<Breakpoint, GridCols>>;
	gap?: Partial<Record<Breakpoint, number>>;
	className?: string;
}

interface ResponsiveContainerProps {
	children: React.ReactNode;
	maxWidth?: Partial<Record<Breakpoint, string>>;
	padding?: Partial<Record<Breakpoint, string>>;
	className?: string;
}

interface FlexLayoutProps {
	children: React.ReactNode;
	direction?: Partial<Record<Breakpoint, 'row' | 'col' | 'row-reverse' | 'col-reverse'>>;
	justify?: Partial<Record<Breakpoint, 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'>>;
	align?: Partial<Record<Breakpoint, 'start' | 'end' | 'center' | 'baseline' | 'stretch'>>;
	wrap?: Partial<Record<Breakpoint, boolean>>;
	gap?: Partial<Record<Breakpoint, number>>;
	className?: string;
}

interface AdaptiveTextProps {
	children: React.ReactNode;
	size?: Partial<Record<Breakpoint, 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'>>;
	weight?: Partial<Record<Breakpoint, 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black'>>;
	align?: Partial<Record<Breakpoint, 'left' | 'center' | 'right' | 'justify'>>;
	className?: string;
	as?: keyof JSX.IntrinsicElements;
}

interface VisibilityProps {
	children: React.ReactNode;
	show?: Partial<Record<Breakpoint, boolean>>;
	hide?: Partial<Record<Breakpoint, boolean>>;
	className?: string;
}

interface SidebarLayoutProps {
	children: React.ReactNode;
	sidebar: React.ReactNode;
	sidebarWidth?: Partial<Record<Breakpoint, string>>;
	sidebarPosition?: 'left' | 'right';
	collapsible?: boolean;
	defaultCollapsed?: boolean;
	className?: string;
}

// Context para el layout responsive
interface ResponsiveContextType {
	breakpoint: Breakpoint;
	isMobile: boolean;
	isTablet: boolean;
	isDesktop: boolean;
}

const ResponsiveContext = createContext<ResponsiveContextType | undefined>(undefined);

// Hook para usar el contexto responsive
export function useResponsiveContext() {
	const context = useContext(ResponsiveContext);
	if (!context) {
		throw new Error('useResponsiveContext debe usarse dentro de ResponsiveProvider');
	}
	return context;
}

// Provider del contexto responsive
export const ResponsiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { isMobile, isTablet, isDesktop } = useResponsive();
	const [breakpoint, setBreakpoint] = useState<Breakpoint>('md');

	useEffect(() => {
		const updateBreakpoint = () => {
			const width = window.innerWidth;
			if (width < 640) setBreakpoint('xs');
			else if (width < 768) setBreakpoint('sm');
			else if (width < 1024) setBreakpoint('md');
			else if (width < 1280) setBreakpoint('lg');
			else if (width < 1536) setBreakpoint('xl');
			else setBreakpoint('2xl');
		};

		updateBreakpoint();
		window.addEventListener('resize', updateBreakpoint);
		return () => window.removeEventListener('resize', updateBreakpoint);
	}, []);

	return (
		<ResponsiveContext.Provider value={{ breakpoint, isMobile, isTablet, isDesktop }}>
			{children}
		</ResponsiveContext.Provider>
	);
};

// Utilidad para obtener valor responsive
function getResponsiveValue<T>(
	values: Partial<Record<Breakpoint, T>>,
	currentBreakpoint: Breakpoint,
	defaultValue: T
): T {
	const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
	const currentIndex = breakpointOrder.indexOf(currentBreakpoint);

	// Buscar el valor más cercano hacia abajo
	for (let i = currentIndex; i >= 0; i--) {
		const bp = breakpointOrder[i];
		if (values[bp] !== undefined) {
			return values[bp] as T;
		}
	}

	return defaultValue;
}

// Grid responsive
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
	children,
	cols = { xs: 1, sm: 2, md: 3, lg: 4 },
	gap = { xs: 4, md: 6 },
	className
}) => {
	const { breakpoint } = useResponsiveContext();
	const currentCols = getResponsiveValue(cols, breakpoint, 1);
	const currentGap = getResponsiveValue(gap, breakpoint, 4);

	return (
		<div
			className={cn(
				'grid',
				`grid-cols-${currentCols}`,
				`gap-${currentGap}`,
				className
			)}
		>
			{children}
		</div>
	);
};

// Container responsive
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
	children,
	maxWidth = { xs: '100%', sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' },
	padding = { xs: '1rem', md: '2rem' },
	className
}) => {
	const { breakpoint } = useResponsiveContext();
	const currentMaxWidth = getResponsiveValue(maxWidth, breakpoint, '100%');
	const currentPadding = getResponsiveValue(padding, breakpoint, '1rem');

	return (
		<div
			className={cn('mx-auto', className)}
			style={{
				maxWidth: currentMaxWidth,
				padding: currentPadding
			}}
		>
			{children}
		</div>
	);
};

// Layout flex responsive
export const FlexLayout: React.FC<FlexLayoutProps> = ({
	children,
	direction = { xs: 'col', md: 'row' },
	justify = { xs: 'start' },
	align = { xs: 'stretch' },
	wrap = { xs: false },
	gap = { xs: 4 },
	className
}) => {
	const { breakpoint } = useResponsiveContext();
	const currentDirection = getResponsiveValue(direction, breakpoint, 'row');
	const currentJustify = getResponsiveValue(justify, breakpoint, 'start');
	const currentAlign = getResponsiveValue(align, breakpoint, 'stretch');
	const currentWrap = getResponsiveValue(wrap, breakpoint, false);
	const currentGap = getResponsiveValue(gap, breakpoint, 4);

	const getDirectionClass = () => {
		switch (currentDirection) {
			case 'row': return 'flex-row';
			case 'col': return 'flex-col';
			case 'row-reverse': return 'flex-row-reverse';
			case 'col-reverse': return 'flex-col-reverse';
			default: return 'flex-row';
		}
	};

	const getJustifyClass = () => {
		switch (currentJustify) {
			case 'start': return 'justify-start';
			case 'end': return 'justify-end';
			case 'center': return 'justify-center';
			case 'between': return 'justify-between';
			case 'around': return 'justify-around';
			case 'evenly': return 'justify-evenly';
			default: return 'justify-start';
		}
	};

	const getAlignClass = () => {
		switch (currentAlign) {
			case 'start': return 'items-start';
			case 'end': return 'items-end';
			case 'center': return 'items-center';
			case 'baseline': return 'items-baseline';
			case 'stretch': return 'items-stretch';
			default: return 'items-stretch';
		}
	};

	return (
		<div
			className={cn(
				'flex',
				getDirectionClass(),
				getJustifyClass(),
				getAlignClass(),
				currentWrap ? 'flex-wrap' : 'flex-nowrap',
				`gap-${currentGap}`,
				className
			)}
		>
			{children}
		</div>
	);
};

// Texto adaptativo
export const AdaptiveText: React.FC<AdaptiveTextProps> = ({
	children,
	size = { xs: 'base', md: 'lg' },
	weight = { xs: 'normal' },
	align = { xs: 'left' },
	className,
	as: Component = 'p'
}) => {
	const { breakpoint } = useResponsiveContext();
	const currentSize = getResponsiveValue(size, breakpoint, 'base');
	const currentWeight = getResponsiveValue(weight, breakpoint, 'normal');
	const currentAlign = getResponsiveValue(align, breakpoint, 'left');

	return (
		<Component
			className={cn(
				`text-${currentSize}`,
				`font-${currentWeight}`,
				`text-${currentAlign}`,
				className
			)}
		>
			{children}
		</Component>
	);
};

// Control de visibilidad responsive
export const ResponsiveVisibility: React.FC<VisibilityProps> = ({
	children,
	show,
	hide,
	className
}) => {
	const { breakpoint } = useResponsiveContext();
	
	const shouldShow = show ? getResponsiveValue(show, breakpoint, true) : true;
	const shouldHide = hide ? getResponsiveValue(hide, breakpoint, false) : false;
	
	const isVisible = shouldShow && !shouldHide;

	if (!isVisible) return null;

	return (
		<div className={className}>
			{children}
		</div>
	);
};

// Layout con sidebar responsive
export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
	children,
	sidebar,
	sidebarWidth = { xs: '100%', md: '256px', lg: '320px' },
	sidebarPosition = 'left',
	collapsible = true,
	defaultCollapsed = false,
	className
}) => {
	const { breakpoint, isMobile } = useResponsiveContext();
	const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed || isMobile);
	const currentSidebarWidth = getResponsiveValue(sidebarWidth, breakpoint, '256px');

	useEffect(() => {
		if (isMobile && !isCollapsed) {
			setIsCollapsed(true);
		}
	}, [isMobile, isCollapsed]);

	const toggleSidebar = () => {
		if (collapsible) {
			setIsCollapsed(!isCollapsed);
		}
	};

	return (
		<div className={cn('flex h-full', className)}>
			{/* Overlay para móvil */}
			{isMobile && !isCollapsed && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 z-40"
					onClick={toggleSidebar}
				/>
			)}

			{/* Sidebar */}
			<aside
				className={cn(
					'transition-all duration-300 ease-in-out bg-white border-r border-gray-200 z-50',
					isMobile ? 'fixed top-0 h-full' : 'relative',
					sidebarPosition === 'left' ? 'left-0' : 'right-0',
					isCollapsed ? (isMobile ? '-translate-x-full' : 'w-0 overflow-hidden') : 'translate-x-0'
				)}
				style={{
					width: isCollapsed ? (isMobile ? currentSidebarWidth : '0') : currentSidebarWidth
				}}
			>
				{!isCollapsed && (
					<div className="h-full overflow-y-auto">
						{sidebar}
					</div>
				)}
			</aside>

			{/* Contenido principal */}
			<main className="flex-1 overflow-hidden">
				{collapsible && (
					<button
						onClick={toggleSidebar}
						className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
						aria-label={isCollapsed ? 'Abrir sidebar' : 'Cerrar sidebar'}
					>
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					</button>
				)}
				<div className="h-full overflow-y-auto p-4">
					{children}
				</div>
			</main>
		</div>
	);
};

// Hook para media queries personalizadas
export function useMediaQuery(query: string) {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		const media = window.matchMedia(query);
		setMatches(media.matches);

		const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
		media.addEventListener('change', listener);

		return () => media.removeEventListener('change', listener);
	}, [query]);

	return matches;
}

// Componente de espaciado responsive
export const ResponsiveSpacing: React.FC<{
	children: React.ReactNode;
	margin?: Partial<Record<Breakpoint, string>>;
	padding?: Partial<Record<Breakpoint, string>>;
	className?: string;
}> = ({ children, margin, padding, className }) => {
	const { breakpoint } = useResponsiveContext();
	const currentMargin = margin ? getResponsiveValue(margin, breakpoint, '0') : '0';
	const currentPadding = padding ? getResponsiveValue(padding, breakpoint, '0') : '0';

	return (
		<div
			className={className}
			style={{
				margin: currentMargin,
				padding: currentPadding
			}}
		>
			{children}
		</div>
	);
};

export type {
	Breakpoint,
	GridCols,
	ResponsiveGridProps,
	ResponsiveContainerProps,
	FlexLayoutProps,
	AdaptiveTextProps,
	VisibilityProps,
	SidebarLayoutProps
};