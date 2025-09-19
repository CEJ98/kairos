import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';
import useOffline from '../hooks/useOffline';

interface OfflineIndicatorProps {
	showDetails?: boolean;
	onSyncPress?: () => void;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
	showDetails = false,
	onSyncPress,
}) => {
	const { colors } = useTheme();
	const { offlineState, isLoading, syncManually } = useOffline();

	const handleSyncPress = async () => {
		if (onSyncPress) {
			onSyncPress();
		} else {
			try {
				await syncManually();
			} catch (error) {
				console.error('Error syncing:', error);
			}
		}
	};

	const styles = StyleSheet.create({
		container: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: 12,
			paddingVertical: 8,
			backgroundColor: offlineState.isConnected 
				? colors.success + '20'
				: colors.warning + '20',
			borderRadius: 8,
			borderWidth: 1,
			borderColor: offlineState.isConnected 
				? colors.success
				: colors.warning,
		},
		icon: {
			marginRight: 8,
		},
		text: {
			flex: 1,
			fontSize: 14,
			color: colors.text.primary,
			fontWeight: '500',
		},
		detailsText: {
			fontSize: 12,
			color: colors.text.secondary,
			marginTop: 2,
		},
		syncButton: {
			paddingHorizontal: 12,
			paddingVertical: 6,
			backgroundColor: colors.primary,
			borderRadius: 6,
			marginLeft: 8,
		},
		syncButtonText: {
			color: colors.text.inverse,
			fontSize: 12,
			fontWeight: '600',
		},
		offlineContainer: {
			flexDirection: 'column',
			alignItems: 'flex-start',
		},
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			width: '100%',
		},
	});

	if (offlineState.isConnected && offlineState.pendingSyncCount === 0) {
		return (
			<View style={styles.container}>
				<Ionicons 
					name="wifi" 
					size={16} 
					color={colors.success} 
					style={styles.icon}
				/>
				<Text style={styles.text}>Conectado</Text>
			</View>
		);
	}

	if (!offlineState.isConnected) {
		return (
			<View style={[styles.container, showDetails && styles.offlineContainer]}>
				<View style={styles.row}>
					<Ionicons 
						name="wifi-outline" 
						size={16} 
						color={colors.warning} 
						style={styles.icon}
					/>
					<Text style={styles.text}>Modo Offline</Text>
				</View>
				{showDetails && (
					<Text style={styles.detailsText}>
						{offlineState.workoutsCount} rutinas • {offlineState.sessionsCount} sesiones guardadas
					</Text>
				)}
			</View>
		);
	}

	// Hay elementos pendientes de sincronización
	return (
		<View style={[styles.container, showDetails && styles.offlineContainer]}>
			<View style={styles.row}>
				<Ionicons 
					name="sync" 
					size={16} 
					color={colors.warning} 
					style={styles.icon}
				/>
				<Text style={styles.text}>
					{offlineState.pendingSyncCount} elementos por sincronizar
				</Text>
				<TouchableOpacity 
					style={styles.syncButton}
					onPress={handleSyncPress}
					disabled={isLoading}
				>
					<Text style={styles.syncButtonText}>
						{isLoading ? 'Sincronizando...' : 'Sincronizar'}
					</Text>
				</TouchableOpacity>
			</View>
			{showDetails && (
				<Text style={styles.detailsText}>
					{offlineState.workoutsCount} rutinas • {offlineState.sessionsCount} sesiones
				</Text>
			)}
		</View>
	);
};

export default OfflineIndicator;