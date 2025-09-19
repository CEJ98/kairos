'use client';

import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { cn } from '@/lib/utils';

// Tipos de animaciones
type AnimationType = 
	| 'fadeIn' 
	| 'fadeOut' 
	| 'slideInLeft' 
	| 'slideInRight' 
	| 'slideInUp' 
	| 'slideInDown'
	| 'scaleIn'
	| 'scaleOut'
	| 'bounce'
	| 'pulse'
	| 'shake'
	| 'flip';

type EasingFunction = 
	| 'ease'
	| 'ease-in'
	| 'ease-out'
	| 'ease-in-out'
	| 'linear'
	| 'cubic-bezier(0.4, 0, 0.2, 1)'; // Material Design

interface AnimatedProps {
	children: React.ReactNode;
	animation: AnimationType;
	duration?: number;
	delay?: number;
	easing?: EasingFunction;
	trigger?: boolean;
	repeat?: boolean | number;
	onAnimationEnd?: () => void;
	className?: string;
}

interface FadeTransitionProps {
	show: boolean;
	children: React.ReactNode;
	duration?: number;
	className?: string;
}

interface SlideTransitionProps {
	show: boolean;
	children: React.ReactNode;
	direction?: 'left' | 'right' | 'up' | 'down';
	duration?: number;
	distance?: number;
	className?: string;
}

interface StaggeredAnimationProps {
	children: React.ReactNode[];
	animation: AnimationType;
	staggerDelay?: number;
	duration?: number;
	trigger?: boolean;
	className?: string;
}

// Definiciones de animaciones CSS
const animationStyles: Record<AnimationType, string> = {
	fadeIn: `
		@keyframes fadeIn {
			from { opacity: 0; }
			to { opacity: 1; }
		}
	`,
	fadeOut: `
		@keyframes fadeOut {
			from { opacity: 1; }
			to { opacity: 0; }
		}
	`,
	slideInLeft: `
		@keyframes slideInLeft {
			from { transform: translateX(-100%); opacity: 0; }
			to { transform: translateX(0); opacity: 1; }
		}
	`,
	slideInRight: `
		@keyframes slideInRight {
			from { transform: translateX(100%); opacity: 0; }
			to { transform: translateX(0); opacity: 1; }
		}
	`,
	slideInUp: `
		@keyframes slideInUp {
			from { transform: translateY(100%); opacity: 0; }
			to { transform: translateY(0); opacity: 1; }
		}
	`,
	slideInDown: `
		@keyframes slideInDown {
			from { transform: translateY(-100%); opacity: 0; }
			to { transform: translateY(0); opacity: 1; }
		}
	`,
	scaleIn: `
		@keyframes scaleIn {
			from { transform: scale(0); opacity: 0; }
			to { transform: scale(1); opacity: 1; }
		}
	`,
	scaleOut: `
		@keyframes scaleOut {
			from { transform: scale(1); opacity: 1; }
			to { transform: scale(0); opacity: 0; }
		}
	`,
	bounce: `
		@keyframes bounce {
			0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
			40%, 43% { transform: translate3d(0, -30px, 0); }
			70% { transform: translate3d(0, -15px, 0); }
			90% { transform: translate3d(0, -4px, 0); }
		}
	`,
	pulse: `
		@keyframes pulse {
			0% { transform: scale(1); }
			50% { transform: scale(1.05); }
			100% { transform: scale(1); }
		}
	`,
	shake: `
		@keyframes shake {
			0%, 100% { transform: translateX(0); }
			10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
			20%, 40%, 60%, 80% { transform: translateX(10px); }
		}
	`,
	flip: `
		@keyframes flip {
			from { transform: perspective(400px) rotateY(-360deg); }
			to { transform: perspective(400px) rotateY(0deg); }
		}
	`
};

// Hook para inyectar estilos de animación
function useAnimationStyles(animation: AnimationType) {
	useEffect(() => {
		const styleId = `animation-${animation}`;
		
		if (!document.getElementById(styleId)) {
			const style = document.createElement('style');
			style.id = styleId;
			style.textContent = animationStyles[animation];
			document.head.appendChild(style);
		}
	}, [animation]);
}

// Componente principal de animación
export const Animated = forwardRef<HTMLDivElement, AnimatedProps>(
	({
		children,
		animation,
		duration = 300,
		delay = 0,
		easing = 'ease-out',
		trigger = true,
		repeat = false,
		onAnimationEnd,
		className
	}, ref) => {
		const [isAnimating, setIsAnimating] = useState(false);
		const [animationCount, setAnimationCount] = useState(0);
		
		useAnimationStyles(animation);

		useEffect(() => {
			if (trigger) {
				setIsAnimating(true);
				setAnimationCount(prev => prev + 1);
			}
		}, [trigger]);

		const handleAnimationEnd = () => {
			if (typeof repeat === 'number' && animationCount >= repeat) {
				setIsAnimating(false);
			} else if (!repeat) {
				setIsAnimating(false);
			}
			
			onAnimationEnd?.();
		};

		const animationStyle = isAnimating ? {
			animation: `${animation} ${duration}ms ${easing} ${delay}ms ${repeat === true ? 'infinite' : typeof repeat === 'number' ? `${repeat}` : '1'} both`
		} : {};

		return (
			<div
				ref={ref}
				className={cn('animation-container', className)}
				style={animationStyle}
				onAnimationEnd={handleAnimationEnd}
			>
				{children}
			</div>
		);
	}
);

Animated.displayName = 'Animated';

// Transición de fade
export const FadeTransition: React.FC<FadeTransitionProps> = ({
	show,
	children,
	duration = 300,
	className
}) => {
	const [shouldRender, setShouldRender] = useState(show);
	const [isVisible, setIsVisible] = useState(show);

	useEffect(() => {
		if (show) {
			setShouldRender(true);
			setTimeout(() => setIsVisible(true), 10);
		} else {
			setIsVisible(false);
			setTimeout(() => setShouldRender(false), duration);
		}
	}, [show, duration]);

	if (!shouldRender) return null;

	return (
		<div
			className={cn(
				'transition-opacity',
				isVisible ? 'opacity-100' : 'opacity-0',
				className
			)}
			style={{ transitionDuration: `${duration}ms` }}
		>
			{children}
		</div>
	);
};

// Transición de slide
export const SlideTransition: React.FC<SlideTransitionProps> = ({
	show,
	children,
	direction = 'left',
	duration = 300,
	distance = 100,
	className
}) => {
	const [shouldRender, setShouldRender] = useState(show);
	const [isVisible, setIsVisible] = useState(show);

	useEffect(() => {
		if (show) {
			setShouldRender(true);
			setTimeout(() => setIsVisible(true), 10);
		} else {
			setIsVisible(false);
			setTimeout(() => setShouldRender(false), duration);
		}
	}, [show, duration]);

	if (!shouldRender) return null;

	const getTransform = () => {
		if (isVisible) return 'translate(0, 0)';
		
		switch (direction) {
			case 'left': return `translateX(-${distance}px)`;
			case 'right': return `translateX(${distance}px)`;
			case 'up': return `translateY(-${distance}px)`;
			case 'down': return `translateY(${distance}px)`;
			default: return `translateX(-${distance}px)`;
		}
	};

	return (
		<div
			className={cn(
				'transition-all',
				isVisible ? 'opacity-100' : 'opacity-0',
				className
			)}
			style={{
				transitionDuration: `${duration}ms`,
				transform: getTransform()
			}}
		>
			{children}
		</div>
	);
};

// Animación escalonada
export const StaggeredAnimation: React.FC<StaggeredAnimationProps> = ({
	children,
	animation,
	staggerDelay = 100,
	duration = 300,
	trigger = true,
	className
}) => {
	return (
		<div className={cn('staggered-container', className)}>
			{children.map((child, index) => (
				<Animated
					key={index}
					animation={animation}
					duration={duration}
					delay={index * staggerDelay}
					trigger={trigger}
				>
					{child}
				</Animated>
			))}
		</div>
	);
};

// Hook para animaciones en scroll
export function useScrollAnimation(threshold = 0.1) {
	const [isVisible, setIsVisible] = useState(false);
	const ref = useRef<HTMLElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				setIsVisible(entry.isIntersecting);
			},
			{ threshold }
		);

		const currentElement = ref.current;
		if (currentElement) {
			observer.observe(currentElement);
		}

		return () => {
			if (currentElement) {
				observer.unobserve(currentElement);
			}
		};
	}, [threshold]);

	return { ref, isVisible };
}

// Componente de animación en scroll
export const ScrollAnimated: React.FC<{
	children: React.ReactNode;
	animation: AnimationType;
	duration?: number;
	threshold?: number;
	className?: string;
}> = ({ children, animation, duration = 600, threshold = 0.1, className }) => {
	const { ref, isVisible } = useScrollAnimation(threshold);

	return (
		<div ref={ref as React.RefObject<HTMLDivElement>}>
			<Animated
				animation={animation}
				duration={duration}
				trigger={isVisible}
				className={className}
			>
				{children}
			</Animated>
		</div>
	);
};

// Hook para animaciones de hover
export function useHoverAnimation() {
	const [isHovered, setIsHovered] = useState(false);

	const hoverProps = {
		onMouseEnter: () => setIsHovered(true),
		onMouseLeave: () => setIsHovered(false)
	};

	return { isHovered, hoverProps };
}

// Componente de loading con animación
export const LoadingSpinner: React.FC<{
	size?: 'sm' | 'md' | 'lg';
	color?: string;
	className?: string;
}> = ({ size = 'md', color = 'currentColor', className }) => {
	const sizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-6 h-6',
		lg: 'w-8 h-8'
	};

	return (
		<div className={cn('inline-block', className)}>
			<div
				className={cn(
					'animate-spin rounded-full border-2 border-solid border-current border-r-transparent',
					sizeClasses[size]
				)}
				style={{ color }}
				role="status"
				aria-label="Cargando"
			>
				<span className="sr-only">Cargando...</span>
			</div>
		</div>
	);
};

// Componente de progreso animado
export const AnimatedProgress: React.FC<{
	value: number;
	max?: number;
	duration?: number;
	color?: string;
	className?: string;
}> = ({ value, max = 100, duration = 500, color = 'bg-primary', className }) => {
	const [animatedValue, setAnimatedValue] = useState(0);

	useEffect(() => {
		const timer = setTimeout(() => {
			setAnimatedValue(value);
		}, 100);

		return () => clearTimeout(timer);
	}, [value]);

	const percentage = (animatedValue / max) * 100;

	return (
		<div className={cn('w-full bg-gray-200 rounded-full h-2', className)}>
			<div
				className={cn('h-2 rounded-full transition-all ease-out', color)}
				style={{
					width: `${percentage}%`,
					transitionDuration: `${duration}ms`
				}}
			/>
		</div>
	);
};

export type {
	AnimationType,
	EasingFunction,
	AnimatedProps,
	FadeTransitionProps,
	SlideTransitionProps,
	StaggeredAnimationProps
};