import React, { useRef, useState, useCallback } from 'react';
import {
	View,
	PanResponder,
	Animated,
	Vibration,
	Dimensions,
	GestureResponderEvent,
	PanResponderGestureState,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface GestureConfig {
	// Drag & Drop
	enableDrag?: boolean;
	dragThreshold?: number;
	onDragStart?: () => void;
	onDragMove?: (gestureState: PanResponderGestureState) => void;
	onDragEnd?: (gestureState: PanResponderGestureState) => void;

	// Swipe gestures
	enableSwipe?: boolean;
	swipeThreshold?: number;
	onSwipeLeft?: () => void;
	onSwipeRight?: () => void;
	onSwipeUp?: () => void;
	onSwipeDown?: () => void;

	// Pinch to zoom
	enablePinch?: boolean;
	onPinchStart?: () => void;
	onPinchMove?: (scale: number) => void;
	onPinchEnd?: (scale: number) => void;

	// Rotation
	enableRotation?: boolean;
	onRotationStart?: () => void;
	onRotationMove?: (rotation: number) => void;
	onRotationEnd?: (rotation: number) => void;

	// Multi-touch
	maxTouches?: number;
	onMultiTouchStart?: (touches: number) => void;
	onMultiTouchEnd?: () => void;

	// Tap gestures
	enableTap?: boolean;
	enableDoubleTap?: boolean;
	enableLongPress?: boolean;
	tapTimeout?: number;
	doubleTapTimeout?: number;
	longPressTimeout?: number;
	onTap?: () => void;
	onDoubleTap?: () => void;
	onLongPress?: () => void;

	// Haptic feedback
	enableHaptics?: boolean;
	hapticPatterns?: {
		tap?: number[];
		drag?: number[];
		swipe?: number[];
		longPress?: number[];
	};

	// Visual feedback
	enableVisualFeedback?: boolean;
	scaleOnPress?: number;
	opacityOnPress?: number;
}

interface EnhancedGestureHandlerProps {
	children: React.ReactNode;
	config: GestureConfig;
	style?: any;
	disabled?: boolean;
}

export default function EnhancedGestureHandler({
	children,
	config,
	style,
	disabled = false,
}: EnhancedGestureHandlerProps) {
	// Animation values
	const scaleAnim = useRef(new Animated.Value(1)).current;
	const opacityAnim = useRef(new Animated.Value(1)).current;
	const translateX = useRef(new Animated.Value(0)).current;
	const translateY = useRef(new Animated.Value(0)).current;
	const rotateAnim = useRef(new Animated.Value(0)).current;

	// State for gesture tracking
	const [lastTap, setLastTap] = useState(0);
	const [tapCount, setTapCount] = useState(0);
	const [isLongPressing, setIsLongPressing] = useState(false);
	const [initialDistance, setInitialDistance] = useState(0);
	const [initialAngle, setInitialAngle] = useState(0);
	const [currentScale, setCurrentScale] = useState(1);
	const [currentRotation, setCurrentRotation] = useState(0);

	// Timers
	const tapTimer = useRef<NodeJS.Timeout | null>(null);
	const longPressTimer = useRef<NodeJS.Timeout | null>(null);

	// Helper functions
	const getDistance = (touches: any[]) => {
		if (touches.length < 2) return 0;
		const [touch1, touch2] = touches;
		return Math.sqrt(
			Math.pow(touch2.pageX - touch1.pageX, 2) + Math.pow(touch2.pageY - touch1.pageY, 2)
		);
	};

	const getAngle = (touches: any[]) => {
		if (touches.length < 2) return 0;
		const [touch1, touch2] = touches;
		return Math.atan2(touch2.pageY - touch1.pageY, touch2.pageX - touch1.pageX) * 180 / Math.PI;
	};

	const triggerHaptic = useCallback((pattern: number[] = [50]) => {
		if (config.enableHaptics && !disabled) {
			Vibration.vibrate(pattern);
		}
	}, [config.enableHaptics, disabled]);

	const animatePress = useCallback((pressed: boolean) => {
		if (!config.enableVisualFeedback) return;

		const scale = pressed ? (config.scaleOnPress || 0.95) : 1;
		const opacity = pressed ? (config.opacityOnPress || 0.8) : 1;

		Animated.parallel([
			Animated.spring(scaleAnim, {
				toValue: scale,
				useNativeDriver: true,
				tension: 300,
				friction: 10,
			}),
			Animated.timing(opacityAnim, {
				toValue: opacity,
				duration: 150,
				useNativeDriver: true,
			}),
		]).start();
	}, [config.enableVisualFeedback, config.scaleOnPress, config.opacityOnPress, scaleAnim, opacityAnim]);

	const resetAnimations = useCallback(() => {
		Animated.parallel([
			Animated.spring(scaleAnim, {
				toValue: 1,
				useNativeDriver: true,
			}),
			Animated.timing(opacityAnim, {
				toValue: 1,
				duration: 150,
				useNativeDriver: true,
			}),
			Animated.spring(translateX, {
				toValue: 0,
				useNativeDriver: true,
			}),
			Animated.spring(translateY, {
				toValue: 0,
				useNativeDriver: true,
			}),
		]).start();
	}, [scaleAnim, opacityAnim, translateX, translateY]);

	const handleTap = useCallback(() => {
		const now = Date.now();
		const timeSinceLastTap = now - lastTap;

		if (config.enableDoubleTap && timeSinceLastTap < (config.doubleTapTimeout || 300)) {
			// Double tap detected
			if (tapTimer.current) {
				clearTimeout(tapTimer.current);
				tapTimer.current = null;
			}
			triggerHaptic(config.hapticPatterns?.tap || [30, 50, 30]);
			config.onDoubleTap?.();
			setTapCount(0);
		} else if (config.enableTap) {
			// Single tap - wait to see if double tap follows
			setTapCount(1);
			tapTimer.current = setTimeout(() => {
				if (tapCount === 1) {
					triggerHaptic(config.hapticPatterns?.tap || [30]);
					config.onTap?.();
				}
				setTapCount(0);
			}, config.tapTimeout || 200);
		}

		setLastTap(now);
	}, [config, lastTap, tapCount, triggerHaptic]);

	const handleLongPress = useCallback(() => {
		if (!config.enableLongPress) return;

		longPressTimer.current = setTimeout(() => {
			setIsLongPressing(true);
			triggerHaptic(config.hapticPatterns?.longPress || [100, 50, 100]);
			config.onLongPress?.();
		}, config.longPressTimeout || 500);
	}, [config, triggerHaptic]);

	const clearTimers = useCallback(() => {
		if (tapTimer.current) {
			clearTimeout(tapTimer.current);
			tapTimer.current = null;
		}
		if (longPressTimer.current) {
			clearTimeout(longPressTimer.current);
			longPressTimer.current = null;
		}
	}, []);

	// Create PanResponder
	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => !disabled,
			onMoveShouldSetPanResponder: (_, gestureState) => {
				if (disabled) return false;
				const threshold = config.dragThreshold || 10;
				return Math.abs(gestureState.dx) > threshold || Math.abs(gestureState.dy) > threshold;
			},

			onPanResponderGrant: (evt) => {
				if (disabled) return;

				animatePress(true);
				handleLongPress();

				// Multi-touch detection
				const touches = evt.nativeEvent.touches;
				if (touches.length > 1) {
					config.onMultiTouchStart?.(touches.length);
					
					if (config.enablePinch && touches.length === 2) {
						setInitialDistance(getDistance(touches));
						config.onPinchStart?.();
					}

					if (config.enableRotation && touches.length === 2) {
						setInitialAngle(getAngle(touches));
						config.onRotationStart?.();
					}
				} else {
					// Single touch - prepare for drag
					if (config.enableDrag) {
						config.onDragStart?.();
					}
				}
			},

			onPanResponderMove: (evt, gestureState) => {
				if (disabled) return;

				const touches = evt.nativeEvent.touches;

				if (touches.length === 1) {
					// Single touch - drag
					if (config.enableDrag) {
						translateX.setValue(gestureState.dx);
						translateY.setValue(gestureState.dy);
						config.onDragMove?.(gestureState);
					}
				} else if (touches.length === 2) {
					// Two touches - pinch and rotate
					if (config.enablePinch) {
						const currentDistance = getDistance(touches);
						const scale = currentDistance / initialDistance;
						setCurrentScale(scale);
						config.onPinchMove?.(scale);
					}

					if (config.enableRotation) {
						const currentAngle = getAngle(touches);
						const rotation = currentAngle - initialAngle;
						setCurrentRotation(rotation);
						rotateAnim.setValue(rotation);
						config.onRotationMove?.(rotation);
					}
				}
			},

			onPanResponderRelease: (_, gestureState) => {
				if (disabled) return;

				clearTimers();
				animatePress(false);

				// Handle swipe gestures
				if (config.enableSwipe) {
					const swipeThreshold = config.swipeThreshold || 50;
					const velocity = 0.3;

					if (Math.abs(gestureState.dx) > swipeThreshold || Math.abs(gestureState.vx) > velocity) {
						if (gestureState.dx > 0) {
							triggerHaptic(config.hapticPatterns?.swipe || [50]);
							config.onSwipeRight?.();
						} else {
							triggerHaptic(config.hapticPatterns?.swipe || [50]);
							config.onSwipeLeft?.();
						}
					} else if (Math.abs(gestureState.dy) > swipeThreshold || Math.abs(gestureState.vy) > velocity) {
						if (gestureState.dy > 0) {
							triggerHaptic(config.hapticPatterns?.swipe || [50]);
							config.onSwipeDown?.();
						} else {
							triggerHaptic(config.hapticPatterns?.swipe || [50]);
							config.onSwipeUp?.();
						}
					}
				}

				// Handle drag end
				if (config.enableDrag) {
					config.onDragEnd?.(gestureState);
				}

				// Handle pinch end
				if (config.enablePinch && currentScale !== 1) {
					config.onPinchEnd?.(currentScale);
					setCurrentScale(1);
				}

				// Handle rotation end
				if (config.enableRotation && currentRotation !== 0) {
					config.onRotationEnd?.(currentRotation);
					setCurrentRotation(0);
				}

				// Handle tap if no significant movement
				if (!isLongPressing && Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10) {
					handleTap();
				}

				setIsLongPressing(false);
				config.onMultiTouchEnd?.();
				resetAnimations();
			},

			onPanResponderTerminate: () => {
				clearTimers();
				animatePress(false);
				setIsLongPressing(false);
				resetAnimations();
			},
		})
	).current;

	return (
		<Animated.View
			{...panResponder.panHandlers}
			style={[
				style,
				{
					transform: [
						{ translateX },
						{ translateY },
						{ scale: scaleAnim },
						{ rotate: rotateAnim.interpolate({
							inputRange: [-360, 360],
							outputRange: ['-360deg', '360deg'],
						}) },
					],
					opacity: opacityAnim,
				},
			]}
		>
			{children}
		</Animated.View>
	);
}

// Preset configurations for common use cases
export const GesturePresets = {
	// Basic tap and long press
	basicTap: {
		enableTap: true,
		enableLongPress: true,
		enableHaptics: true,
		enableVisualFeedback: true,
	} as GestureConfig,

	// Drag and drop
	dragDrop: {
		enableDrag: true,
		enableHaptics: true,
		enableVisualFeedback: true,
		scaleOnPress: 1.05,
		opacityOnPress: 0.8,
	} as GestureConfig,

	// Swipe gestures
	swipeActions: {
		enableSwipe: true,
		swipeThreshold: 80,
		enableHaptics: true,
		enableVisualFeedback: true,
	} as GestureConfig,

	// Multi-touch (pinch and rotate)
	multiTouch: {
		enablePinch: true,
		enableRotation: true,
		maxTouches: 2,
		enableHaptics: true,
	} as GestureConfig,

	// Complete gesture set for workout builder
	workoutBuilder: {
		enableTap: true,
		enableDoubleTap: true,
		enableLongPress: true,
		enableDrag: true,
		enableSwipe: true,
		swipeThreshold: 100,
		enableHaptics: true,
		enableVisualFeedback: true,
		scaleOnPress: 1.02,
		opacityOnPress: 0.9,
		hapticPatterns: {
			tap: [30],
			drag: [50],
			swipe: [50, 30],
			longPress: [100, 50, 100],
		},
	} as GestureConfig,
};