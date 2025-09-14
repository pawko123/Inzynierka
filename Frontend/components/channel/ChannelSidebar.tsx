import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useResponsive } from '@/hooks/useResponsive';
import { Colors } from '@/constants/Colors';
import { getStrings } from '@/i18n';
import ChannelSection from './ChannelSection';
import ServerActionButtons from '../server/ServerActionButtons';
import { ChannelSidebarProps } from '@/types/server';

export default function ChannelSidebar({
	serverId,
	serverName,
	channels,
	loading,
	error,
	canManageServer,
	canManageRoles,
	canCreateInvite,
	onChannelPress,
	onAddChannel,
	onManageRoles,
	onRetry,
}: ChannelSidebarProps) {
	const colorScheme = useColorScheme();
	const { isMobile } = useResponsive();
	const colors = Colors[colorScheme ?? 'light'];
	const Resources = getStrings();

	return (
		<View
			style={[
				isMobile ? styles.channelSidebarMobile : styles.channelSidebar,
				{ backgroundColor: colors.background, borderRightColor: colors.border },
			]}
		>
			{/* Server Header */}
			<View style={[styles.serverHeader, { borderBottomColor: colors.border }]}>
				<Text style={[styles.serverName, { color: colors.text }]}>
					{serverName || 'Server'}
				</Text>
				<ServerActionButtons
					serverId={serverId}
					canManageRoles={canManageRoles}
					canCreateInvite={canCreateInvite}
					onManageRoles={onManageRoles}
				/>
			</View>

			{loading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="small" color={colors.tint} />
					<Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>
						{Resources.ServerContent.Loading_Channels}
					</Text>
				</View>
			) : error ? (
				<View style={styles.errorContainer}>
					<Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
					<TouchableOpacity
						style={[styles.retryButton, { backgroundColor: colors.tint }]}
						onPress={onRetry}
					>
						<Text style={styles.retryButtonText}>{Resources.ServerContent.Retry}</Text>
					</TouchableOpacity>
				</View>
			) : (
				<View style={styles.channelsContainer}>
					{/* Text Channels Section */}
					<ChannelSection
						title={Resources.ServerContent.Text_Channels}
						channels={channels.filter((channel) => channel.type !== 'voice')}
						canManageServer={canManageServer}
						onChannelPress={onChannelPress}
						onAddChannel={onAddChannel}
					/>

					{/* Voice Channels Section */}
					<ChannelSection
						title={Resources.ServerContent.Voice_Channels}
						channels={channels.filter((channel) => channel.type === 'voice')}
						canManageServer={canManageServer}
						onChannelPress={onChannelPress}
						onAddChannel={onAddChannel}
					/>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	channelSidebar: {
		width: 240,
		borderRightWidth: 1,
	},
	channelSidebarMobile: {
		flex: 1, // Take full width on mobile
		borderRightWidth: 0, // No border on mobile
	},
	serverHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		borderBottomWidth: 1,
	},
	serverName: {
		fontSize: 18,
		fontWeight: 'bold',
		flex: 1,
	},
	channelsContainer: {
		flex: 1,
		padding: 8,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		gap: 12,
	},
	loadingText: {
		fontSize: 14,
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
		gap: 16,
	},
	errorText: {
		fontSize: 14,
		textAlign: 'center',
	},
	retryButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 6,
	},
	retryButtonText: {
		color: 'white',
		fontWeight: '600',
		fontSize: 14,
	},
});
