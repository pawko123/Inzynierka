import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Alert,
	BackHandler,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useResponsive } from '@/hooks/useResponsive';
import { Colors } from '@/constants/Colors';
import { getStrings } from '@/i18n';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import CreateChannelModal from '../channel/CreateChannelModal';
import ChannelSidebar from '../channel/ChannelSidebar';
import { translateError } from '@/utils/errorTranslator';
import RolesManagement from '../rolemanagement/RolesManagement';
import ChannelChat from '../channel/ChannelChat';
import { Channel, ServerContentProps } from '@/types/server';

export default function ServerContent({ serverId, serverName, onChannelSelect }: ServerContentProps) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];
	const { isMobile } = useResponsive();
	const Resources = getStrings();
	const { currentUser } = useAuth();

	const [channels, setChannels] = useState<Channel[]>([]);
	const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
	const [canManageServer, setCanManageServer] = useState(false);
	const [canManageRoles, setCanManageRoles] = useState(false);
	const [canCreateInvite, setCanCreateInvite] = useState(false);
	const [showRolesManagement, setShowRolesManagement] = useState(false);
	
	// Mobile navigation state - true = show sidebar, false = show content
	const [showMobileSidebar, setShowMobileSidebar] = useState(true);

	const fetchServerChannels = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			
			const { data } = await api.get(`/server/getChannelsForUser?serverId=${serverId}`);
			console.log('Fetched channels for server:', serverId, 'Channels:', data);
			setChannels(data);
		} catch (err: any) {
			console.error('Error fetching server channels:', err);
			const backendErrorMessage = err.response?.data?.error || Resources.ServerContent.Errors.Failed_To_Load;
			const localizedErrorMessage = translateError(backendErrorMessage);
			setError(localizedErrorMessage);
			Alert.alert(Resources.CreateChannel.Error, localizedErrorMessage);
		} finally {
			setLoading(false);
		}
	}, [serverId, Resources.ServerContent.Errors.Failed_To_Load, Resources.CreateChannel.Error]);

	const checkUserPermissions = useCallback(async () => {
		if (!currentUser) return;
		
		try {
			// Check user's permissions for this server
			const { data } = await api.post('/server/getUserPermissions', {
				serverId: serverId,
				userId: currentUser.id,
				permissions: ['MANAGE_SERVER', 'MANAGE_ROLES', 'CREATE_INVITE']
			});
			setCanManageServer(data.MANAGE_SERVER || false);
			setCanManageRoles(data.MANAGE_ROLES || false);
			setCanCreateInvite(data.CREATE_INVITE || false);
		} catch (err: any) {
			console.error('Error checking user permissions:', err);
			// If we can't check permissions, assume they don't have them for safety
			setCanManageServer(false);
			setCanManageRoles(false);
			setCanCreateInvite(false);
		}
	}, [serverId, currentUser]);

	useEffect(() => {
		fetchServerChannels();
		checkUserPermissions();
	}, [fetchServerChannels, checkUserPermissions]);

	// Reset state when serverId changes
	useEffect(() => {
		setSelectedChannel(null);
		setShowRolesManagement(false);
		setError(null);
		setShowMobileSidebar(true); // Always start with sidebar on mobile when switching servers
	}, [serverId]);

	// Handle Android back button on mobile
	useEffect(() => {
		if (!isMobile) return;

		const backAction = () => {
			if (!showMobileSidebar) {
				// If we're showing content, go back to sidebar
				setShowMobileSidebar(true);
				return true; // Prevent default back behavior
			}
			// If we're showing sidebar, allow default back behavior (go to main screen)
			return false;
		};

		const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
		return () => backHandler.remove();
	}, [isMobile, showMobileSidebar]);

	// Debug: Log channels when they change
	useEffect(() => {
		console.log('Channels updated:', channels, 'Loading:', loading, 'Error:', error);
		console.log('Mobile state:', { isMobile, showMobileSidebar });
		console.log('Should show sidebar:', (!isMobile || showMobileSidebar));
	}, [channels, loading, error, isMobile, showMobileSidebar]);

	const handleChannelPress = (channel: Channel) => {
		console.log('Selected channel:', channel);
		setSelectedChannel(channel);
		onChannelSelect?.(channel.id);
		
		// On mobile, show content when channel is selected
		if (isMobile) {
			setShowMobileSidebar(false);
		}
	};

	const handleManageRoles = () => {
		setShowRolesManagement(true);
		// On mobile, show content when roles management is opened
		if (isMobile) {
			setShowMobileSidebar(false);
		}
	};	const handleCreateChannel = () => {
		setShowCreateChannelModal(true);
	};

	const handleChannelCreated = (newChannel: any) => {
		// Add the new channel to the list and refetch to ensure we have all data
		fetchServerChannels();
	};

	return (
		<>
			<View style={[
				isMobile ? styles.mobileContainer : styles.container, 
				{ backgroundColor: colors.background }
			]}>
				{/* On mobile: show either sidebar OR content. On desktop: show both */}
				{(!isMobile || showMobileSidebar) && (
					<ChannelSidebar
						serverId={serverId}
						serverName={serverName}
						channels={channels}
						loading={loading}
						error={error}
						canManageServer={canManageServer}
						canManageRoles={canManageRoles}
						canCreateInvite={canCreateInvite}
						onChannelPress={handleChannelPress}
						onAddChannel={handleCreateChannel}
						onManageRoles={handleManageRoles}
						onRetry={fetchServerChannels}
					/>
				)}

				{/* Main Content Area */}
				{(!isMobile || !showMobileSidebar) && (
					<View style={[styles.mainContent, { backgroundColor: colors.background }]}>
						{showRolesManagement ? (
							<RolesManagement
								serverId={serverId}
								serverName={serverName || 'Server'}
								onClose={() => {
									setShowRolesManagement(false);
									// On mobile, go back to sidebar when closing roles management
									if (isMobile) {
										setShowMobileSidebar(true);
									}
								}}
							/>
						) : selectedChannel ? (
							<ChannelChat
								channel={selectedChannel}
								serverId={serverId}
							/>
						) : (
							<View style={styles.welcomeContainer}>
								<Text style={[styles.welcomeText, { color: colors.tabIconDefault }]}>
									{Resources.ServerContent.Select_Channel}
								</Text>
							</View>
						)}
					</View>
				)}
			</View>

		<CreateChannelModal
			visible={showCreateChannelModal}
			onClose={() => setShowCreateChannelModal(false)}
			serverId={serverId}
			onChannelCreated={handleChannelCreated}
		/>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
	},
	mobileContainer: {
		flex: 1,
		flexDirection: 'column', // Stack vertically on mobile instead of side by side
	},
	mainContent: {
		flex: 1,
	},
	welcomeContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	welcomeText: {
		fontSize: 16,
		textAlign: 'center',
	},
});
