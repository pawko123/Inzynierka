import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Alert,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { getStrings } from '@/i18n';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import CreateChannelModal from './CreateChannelModal';
import ChannelSidebar from './ChannelSidebar';
import { translateError } from '@/utils/errorTranslator';
import RolesManagement from './RolesManagement';

interface Channel {
	id: string;
	name: string;
	type: string;
	createdAt: string;
}

interface ServerContentProps {
	serverId: string;
	serverName?: string;
	onChannelSelect?: (channelId: string) => void;
}

export default function ServerContent({ serverId, serverName, onChannelSelect }: ServerContentProps) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];
	const Resources = getStrings();
	const { currentUser } = useAuth();

	const [channels, setChannels] = useState<Channel[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
	const [canManageServer, setCanManageServer] = useState(false);
	const [canManageRoles, setCanManageRoles] = useState(false);
	const [canCreateInvite, setCanCreateInvite] = useState(false);
	const [showRolesManagement, setShowRolesManagement] = useState(false);

	const fetchServerChannels = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			
			const { data } = await api.get(`/server/getChannels?serverId=${serverId}`);
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

	const handleChannelPress = (channel: Channel) => {
		console.log('Selected channel:', channel);
		onChannelSelect?.(channel.id);
	};

	const handleCreateChannel = () => {
		setShowCreateChannelModal(true);
	};

	const handleChannelCreated = (newChannel: any) => {
		// Add the new channel to the list and refetch to ensure we have all data
		fetchServerChannels();
	};

	const handleManageRoles = () => {
		setShowRolesManagement(true);
	};

	return (
		<>
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				{/* Channel Sidebar */}
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

			{/* Main Content Area */}
			<View style={[styles.mainContent, { backgroundColor: colors.background }]}>
				{showRolesManagement ? (
					<RolesManagement
						serverId={serverId}
						serverName={serverName || 'Server'}
						onClose={() => setShowRolesManagement(false)}
					/>
				) : (
					<View style={styles.welcomeContainer}>
						<Text style={[styles.welcomeText, { color: colors.tabIconDefault }]}>
							{Resources.ServerContent.Select_Channel}
						</Text>
					</View>
				)}
			</View>
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
