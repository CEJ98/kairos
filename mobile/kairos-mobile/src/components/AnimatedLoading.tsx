import React, { useRef, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Animated,
	Easing,
	ViewStyle,
	TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';

type LoadingVariant = 'spinner' | 'dots' | 'pulse' | 'skeleton' | 'wave' | 'bounce';
type LoadingSize = 'sm' | 'md' | 'lg';

interface AnimatedLoadingProps {
	variant?: LoadingVariant;
	size?: LoadingSize;
	color?: string;
	text?: string;
	textStyle?: TextStyle;
	style?: ViewStyle;
	showText?: boolean;
	fullScreen?: boolean;
	overlay?: boolean;
	animationDuration?: number;
}

export const AnimatedLoading: React.FC<AnimatedLoadingProps> = ({
	variant = 'spinner',
	size = 'md',
	color,
	text = 'Cargando...',
	textStyle,
	style,
	showText = true,
	fullScreen = false,
	overlay = false,
	animationDuration = 1000,
}) => {
	const { colors } = useTheme();
	const spinAnim = useRef(new Animated.Value(0)).current;
	const pulseAnim = useRef(new Animated.Value(1)).current;
	const waveAnim = useRef(new Animated.Value(0)).current;
	const bounceAnim = useRef(new Animated.Value(0)).current;
	const dot1Anim = useRef(new Animated.Value(0)).current;
	const dot2Anim = useRef(new Animated.Value(0)).current;
	const dot3Anim = useRef(new Animated.Value(0)).current;

	const loadingColor = color || colors.primary;

	useEffect(() => {
		startAnimation();
	}, [variant]);

	const startAnimation = () => {
		switch (variant) {
			case 'spinner':
				startSpinAnimation();
				break;
			case 'dots':
				startDotsAnimation();
				break;
			case 'pulse':
				startPulseAnimation();
				break;
			case 'wave':
				startWaveAnimation();
				break;
			case 'bounce':
				startBounceAnimation();
				break;
			case 'skeleton':
				startSkeletonAnimation();
				break;
		}
	};

	const startSpinAnimation = () => {
		Animated.loop(
			Animated.timing(spinAnim, {
				toValue: 1,
				duration: animationDuration,
				useNativeDriver: true,
				easing: Easing.linear,
			})
		).start();
	};

	const startDotsAnimation = () => {
		const createDotAnimation = (animValue: Animated.Value, delay: number) => {
			return Animated.loop(
				Animated.sequence([
					Animated.timing(animValue, {
						toValue: 1,
						duration: 400,
						useNativeDriver: true,
						easing: Easing.inOut(Easing.ease),
						delay,
					}),
					Animated.timing(animValue, {
						toValue: 0,
						duration: 400,
						useNativeDriver: true,
						easing: Easing.inOut(Easing.ease),
					}),
				])
			);
		};

		createDotAnimation(dot1Anim, 0).start();
		createDotAnimation(dot2Anim, 200).start();
		createDotAnimation(dot3Anim, 400).start();
	};

	const startPulseAnimation = () => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(pulseAnim, {
					toValue: 1.2,
					duration: animationDuration / 2,
					useNativeDriver: true,
					easing: Easing.inOut(Easing.ease),
				}),
				Animated.timing(pulseAnim, {
					toValue: 1,
					duration: animationDuration / 2,
					useNativeDriver: true,
					easing: Easing.inOut(Easing.ease),
				}),
			])
		).start();
	};

	const startWaveAnimation = () => {
		Animated.loop(
			Animated.timing(waveAnim, {
				toValue: 1,
				duration: animationDuration,
				useNativeDriver: false,
				easing: Easing.linear,
			})
		).start();
	};

	const startBounceAnimation = () => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(bounceAnim, {
					toValue: -20,
					duration: animationDuration / 2,
					useNativeDriver: true,
					easing: Easing.out(Easing.quad),
				}),
				Animated.timing(bounceAnim, {
					toValue: 0,
					duration: animationDuration / 2,
					useNativeDriver: true,
					easing: Easing.in(Easing.quad),
				}),
			])
		).start();
	};

	const startSkeletonAnimation = () => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(waveAnim, {
					toValue: 1,
					duration: animationDuration,
					useNativeDriver: false,
					easing: Easing.inOut(Easing.ease),
				}),
				Animated.timing(waveAnim, {
					toValue: 0,
					duration: 0,
					useNativeDriver: false,
				}),
			])
		).start();
	};

	const getSizeStyles = () => {
		switch (size) {
			case 'sm':
				return {
					width: 20,
					height: 20,
					borderWidth: 2,
				};
			case 'lg':
				return {
					width: 40,
					height: 40,
					borderWidth: 4,
				};
			default:
				return {
					width: 30,
					height: 30,
					borderWidth: 3,
				};
		}
	};

	const renderSpinner = () => {
		const spin = spinAnim.interpolate({
			inputRange: [0, 1],
			outputRange: ['0deg', '360deg'],
		});

		return (
			<Animated.View
				style={[
					styles.spinner,
					getSizeStyles(),
					{
						borderColor: `${loadingColor}20`,
						borderTopColor: loadingColor,
						transform: [{ rotate: spin }],
					},
				]}
			/>
		);
	};

	const renderDots = () => {
		const dotSize = size === 'sm' ? 6 : size === 'lg' ? 12 : 8;

		return (
			<View style={styles.dotsContainer}>
				<Animated.View
					style={[
						styles.dot,
						{
							width: dotSize,
							height: dotSize,
							backgroundColor: loadingColor,
							opacity: dot1Anim,
						},
					]}
				/>
				<Animated.View
					style={[
						styles.dot,
						{
							width: dotSize,
							height: dotSize,
							backgroundColor: loadingColor,
							opacity: dot2Anim,
						},
					]}
				/>
				<Animated.View
					style={[
						styles.dot,
						{
							width: dotSize,
							height: dotSize,
							backgroundColor: loadingColor,
							opacity: dot3Anim,
						},
					]}
				/>
			</View>
		);
	};

	const renderPulse = () => {
		return (
			<Animated.View
				style={[
					styles.pulse,
					getSizeStyles(),
					{
						backgroundColor: loadingColor,
						transform: [{ scale: pulseAnim }],
					},
				]}
			/>
		);
	};

	const renderWave = () => {
		const waveTranslate = waveAnim.interpolate({
			inputRange: [0, 1],
			outputRange: [-100, 100],
		});

		return (
			<View style={[styles.waveContainer, getSizeStyles()]}>
				<Animated.View
					style={[
						styles.wave,
						{
							backgroundColor: loadingColor,
							transform: [{ translateX: waveTranslate }],
						},
					]}
				/>
			</View>
		);
	};

	const renderBounce = () => {
		return (
			<Animated.View
				style={[
					styles.bounce,
					getSizeStyles(),
					{
						backgroundColor: loadingColor,
						transform: [{ translateY: bounceAnim }],
					},
				]}
			/>
		);
	};

	const renderSkeleton = () => {
		const skeletonOpacity = waveAnim.interpolate({
			inputRange: [0, 0.5, 1],
			outputRange: [0.3, 0.7, 0.3],
		});

		return (
			<View style={styles.skeletonContainer}>
				<Animated.View
					style={[
						styles.skeletonLine,
						{ opacity: skeletonOpacity },
					]}
				/>
				<Animated.View
					style={[
						styles.skeletonLine,
						styles.skeletonLineShort,
						{ opacity: skeletonOpacity },
					]}
				/>
				<Animated.View
					style={[
						styles.skeletonLine,
						{ opacity: skeletonOpacity },
					]}
				/>
			</View>
		);
	};

	const renderLoadingContent = () => {
		switch (variant) {
			case 'spinner':
				return renderSpinner();
			case 'dots':
				return renderDots();
			case 'pulse':
				return renderPulse();
			case 'wave':
				return renderWave();
			case 'bounce':
				return renderBounce();
			case 'skeleton':
				return renderSkeleton();
			default:
				return renderSpinner();
		}
	};

	const containerStyle = [
		styles.container,
		fullScreen && styles.fullScreen,
		overlay && styles.overlay,
		style,
	];

	return (
		<View style={containerStyle}>
			{renderLoadingContent()}
			{showText && variant !== 'skeleton' && (
				<Text
					style={[
						styles.text,
						{ color: colors.text.secondary },
						textStyle,
					]}
				>
					{text}
				</Text>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20,
	},
	fullScreen: {
		flex: 1,
		width: '100%',
		height: '100%',
		position: 'absolute',
		top: 0,
		left: 0,
		zIndex: 1000,
	},
	overlay: {
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	spinner: {
		borderRadius: 50,
	},
	dotsContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	dot: {
		borderRadius: 50,
		marginHorizontal: 4,
	},
	pulse: {
		borderRadius: 50,
	},
	waveContainer: {
		overflow: 'hidden',
		borderRadius: 4,
		backgroundColor: '#e0e0e0',
	},
	wave: {
		width: '50%',
		height: '100%',
		opacity: 0.6,
	},
	bounce: {
		borderRadius: 50,
	},
	skeletonContainer: {
		width: 200,
		padding: 10,
	},
	skeletonLine: {
		height: 12,
		backgroundColor: '#e0e0e0',
		borderRadius: 6,
		marginVertical: 4,
	},
	skeletonLineShort: {
		width: '70%',
	},
	text: {
		marginTop: 12,
		fontSize: 14,
		textAlign: 'center',
	},
});

export default AnimatedLoading;