'use client';

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Animated } from './animations';

// Tipos de feedback
type FeedbackType = 'success' | 'error' | 'warning' | 'info';
type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

interface Toast {
	id: string;
	type: FeedbackType;
	title?: string;
	message: string;
	duration?: number;
	action?: {
		label: string;
		onClick: () => void;
	};
	persistent?: boolean;
}

interface ToastContextType {
	toasts: Toast[];
	addToast: (toast: Omit<Toast, 'id'>) => void;
	removeToast: (id: string) => void;
	clearAll: () => void;
}

interface AlertProps {
	type: FeedbackType;
	title?: string;
	children: React.ReactNode;
	dismissible?: boolean;
	onDismiss?: () => void;
	className?: string;
	icon?: React.ReactNode;
}

interface ProgressFeedbackProps {
	value: number;
	max?: number;
	label?: string;
	showPercentage?: boolean;
	color?: string;
	size?: 'sm' | 'md' | 'lg';
	className?: string;
}

interface SkeletonProps {
	width?: string | number;
	height?: string | number;
	className?: string;
	variant?: 'text' | 'rectangular' | 'circular';
	animation?: 'pulse' | 'wave';
}

// Context para toasts
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Hook para usar toasts
export function useToast() {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error('useToast debe usarse dentro de ToastProvider');
	}
	return context;
}

// Provider de toasts
export const ToastProvider: React.FC<{ children: React.ReactNode; position?: ToastPosition }> = ({ 
	children, 
	position = 'top-right' 
}) => {
	const [toasts, setToasts] = useState<Toast[]>([]);

	// Declarar primero removeToast para poder referenciarlo en addToast
	const removeToast = useCallback((id: string) => {
		setToasts(prev => prev.filter(toast => toast.id !== id));
	}, []);

	const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
		const id = Math.random().toString(36).substr(2, 9);
		setToasts(prev => [...prev, { ...toast, id }]);

		// Auto-remove si no es persistente
		if (!toast.persistent) {
			setTimeout(() => {
				removeToast(id);
			}, toast.duration || 5000);
		}
	}, [removeToast]);

	const clearAll = useCallback(() => {
		setToasts([]);
	}, []);

	const getPositionClasses = () => {
		switch (position) {
			case 'top-right': return 'top-4 right-4';
			case 'top-left': return 'top-4 left-4';
			case 'bottom-right': return 'bottom-4 right-4';
			case 'bottom-left': return 'bottom-4 left-4';
			case 'top-center': return 'top-4 left-1/2 transform -translate-x-1/2';
			case 'bottom-center': return 'bottom-4 left-1/2 transform -translate-x-1/2';
			default: return 'top-4 right-4';
		}
	};

	return (
		<ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
			{children}
			<div className={cn('fixed z-50 flex flex-col gap-2', getPositionClasses())}>
				{toasts.map(toast => (
					<ToastComponent key={toast.id} toast={toast} onRemove={removeToast} />
				))}
			</div>
		</ToastContext.Provider>
	);
};

// Componente individual de toast
const ToastComponent: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
	const getIcon = () => {
		switch (toast.type) {
			case 'success': return <CheckCircle className="w-5 h-5" />;
			case 'error': return <AlertCircle className="w-5 h-5" />;
			case 'warning': return <AlertTriangle className="w-5 h-5" />;
			case 'info': return <Info className="w-5 h-5" />;
		}
	};

	const getColorClasses = () => {
		switch (toast.type) {
			case 'success': return 'bg-green-50 border-green-200 text-green-800';
			case 'error': return 'bg-red-50 border-red-200 text-red-800';
			case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
			case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
		}
	};

	return (
		<Animated animation="slideInRight" duration={300}>
			<div className={cn(
				'max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto border',
				getColorClasses()
			)}>
				<div className="p-4">
					<div className="flex items-start">
						<div className="flex-shrink-0">
							{getIcon()}
						</div>
						<div className="ml-3 w-0 flex-1">
							{toast.title && (
								<p className="text-sm font-medium">{toast.title}</p>
							)}
							<p className={cn('text-sm', toast.title ? 'mt-1' : '')}>
								{toast.message}
							</p>
							{toast.action && (
								<div className="mt-3">
									<button
										onClick={toast.action.onClick}
										className="text-sm font-medium underline hover:no-underline focus:outline-none"
									>
										{toast.action.label}
									</button>
								</div>
							)}
						</div>
						<div className="ml-4 flex-shrink-0 flex">
							<button
								onClick={() => onRemove(toast.id)}
								className="inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
							>
								<X className="w-5 h-5" />
							</button>
						</div>
					</div>
				</div>
			</div>
		</Animated>
	);
};

// Componente de alerta
export const Alert: React.FC<AlertProps> = ({
	type,
	title,
	children,
	dismissible = false,
	onDismiss,
	className,
	icon
}) => {
	const [isVisible, setIsVisible] = useState(true);

	const handleDismiss = () => {
		setIsVisible(false);
		onDismiss?.();
	};

	const getIcon = () => {
		if (icon) return icon;
		
		switch (type) {
			case 'success': return <CheckCircle className="w-5 h-5" />;
			case 'error': return <AlertCircle className="w-5 h-5" />;
			case 'warning': return <AlertTriangle className="w-5 h-5" />;
			case 'info': return <Info className="w-5 h-5" />;
		}
	};

	const getColorClasses = () => {
		switch (type) {
			case 'success': return 'bg-green-50 border-green-200 text-green-800';
			case 'error': return 'bg-red-50 border-red-200 text-red-800';
			case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
			case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
		}
	};

	if (!isVisible) return null;

	return (
		<div className={cn(
			'rounded-md border p-4',
			getColorClasses(),
			className
		)}>
			<div className="flex">
				<div className="flex-shrink-0">
					{getIcon()}
				</div>
				<div className="ml-3 flex-1">
					{title && (
						<h3 className="text-sm font-medium mb-1">{title}</h3>
					)}
					<div className="text-sm">{children}</div>
				</div>
				{dismissible && (
					<div className="ml-auto pl-3">
						<button
							onClick={handleDismiss}
							className="inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
						>
							<X className="w-5 h-5" />
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

// Componente de progreso con feedback
export const ProgressFeedback: React.FC<ProgressFeedbackProps> = ({
	value,
	max = 100,
	label,
	showPercentage = true,
	color = 'bg-blue-600',
	size = 'md',
	className
}) => {
	const percentage = Math.min((value / max) * 100, 100);
	
	const getSizeClasses = () => {
		switch (size) {
			case 'sm': return 'h-1';
			case 'md': return 'h-2';
			case 'lg': return 'h-3';
		}
	};

	return (
		<div className={cn('w-full', className)}>
			{(label || showPercentage) && (
				<div className="flex justify-between items-center mb-2">
					{label && <span className="text-sm font-medium text-gray-700">{label}</span>}
					{showPercentage && (
						<span className="text-sm text-gray-500">{Math.round(percentage)}%</span>
					)}
				</div>
			)}
			<div className={cn('bg-gray-200 rounded-full overflow-hidden', getSizeClasses())}>
				<div
					className={cn('transition-all duration-500 ease-out rounded-full', color, getSizeClasses())}
					style={{ width: `${percentage}%` }}
				/>
			</div>
		</div>
	);
};

// Componente skeleton para loading states
export const Skeleton: React.FC<SkeletonProps> = ({
	width = '100%',
	height = '1rem',
	className,
	variant = 'rectangular',
	animation = 'pulse'
}) => {
	const getVariantClasses = () => {
		switch (variant) {
			case 'text': return 'rounded';
			case 'rectangular': return 'rounded-md';
			case 'circular': return 'rounded-full';
		}
	};

	const getAnimationClasses = () => {
		switch (animation) {
			case 'pulse': return 'animate-pulse';
			case 'wave': return 'animate-pulse'; // Podríamos agregar una animación de onda personalizada
		}
	};

	return (
		<div
			className={cn(
				'bg-gray-200 dark:bg-gray-700',
				getVariantClasses(),
				getAnimationClasses(),
				className
			)}
			style={{ width, height }}
			aria-label="Cargando contenido"
		/>
	);
};

// Hook para feedback de acciones
export function useActionFeedback() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const { addToast } = useToast();

	const executeAction = useCallback(async (
		action: () => Promise<any>,
		options?: {
			successMessage?: string;
			errorMessage?: string;
			showToast?: boolean;
		}
	) => {
		setIsLoading(true);
		setError(null);
		setSuccess(null);

		try {
			const result = await action();
			
			if (options?.successMessage) {
				setSuccess(options.successMessage);
				
				if (options.showToast) {
					addToast({
						type: 'success',
						message: options.successMessage
					});
				}
			}
			
			return result;
		} catch (err) {
			const errorMessage = options?.errorMessage || 
				(err instanceof Error ? err.message : 'Ha ocurrido un error');
			
			setError(errorMessage);
			
			if (options?.showToast) {
				addToast({
					type: 'error',
					message: errorMessage
				});
			}
			
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, [addToast]);

	const clearFeedback = useCallback(() => {
		setError(null);
		setSuccess(null);
	}, []);

	return {
		isLoading,
		error,
		success,
		executeAction,
		clearFeedback
	};
}

// Componente de estado vacío
export const EmptyState: React.FC<{
	title: string;
	description?: string;
	icon?: React.ReactNode;
	action?: {
		label: string;
		onClick: () => void;
	};
	className?: string;
}> = ({ title, description, icon, action, className }) => {
	return (
		<div className={cn('text-center py-12', className)}>
			{icon && (
				<div className="mx-auto w-12 h-12 text-gray-400 mb-4">
					{icon}
				</div>
			)}
			<h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
			{description && (
				<p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
			)}
			{action && (
				<button
					onClick={action.onClick}
					className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					{action.label}
				</button>
			)}
		</div>
	);
};

export type {
	FeedbackType,
	ToastPosition,
	Toast,
	AlertProps,
	ProgressFeedbackProps,
	SkeletonProps
};
