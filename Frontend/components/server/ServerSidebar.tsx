import React, { useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	ActivityIndicator,
	TouchableOpacity,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import ServerItem from '@/components/ui/ServerItem';
import DirectChannelItem from '@/components/ui/DirectChannelItem';
import { SidebarActionButtons } from '@/components/ui';
import type { Server, DirectChannel } from '@/types/sidebar';
import { getStrings } from '@/i18n';
import { MainServerSidebarProps } from '@/types/server';

export interface ServerSidebarRef {
	refreshData: () => Promise<void>;
	addServer: (server: Server) => void;
	addDirectChannel: (channel: DirectChannel) => void;
}

const ServerSidebar = forwardRef<ServerSidebarRef, MainServerSidebarProps>(({ 
	onServerSelect, 
	onDirectChannelSelect,
	onAddServer,
	onCreateDirectMessage,
	onJoinServer
}, ref) => {
	const colorScheme = useColorScheme();
	const { currentUser, signOut } = useAuth();
	const [servers, setServers] = useState<Server[]>([]);
	const [directChannels, setDirectChannels] = useState<DirectChannel[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
	const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
	const Resources = getStrings();

	const handleLogout = async () => {
		try {
			await signOut();
		} catch (error) {
			console.error('Logout error:', error);
		}
	};

	const fetchUserData = useCallback(async () => {
		try {
			setLoading(true);
			
			// Fetch user servers
			const serversResponse = await api.get('/server/user-servers');
			setServers(serversResponse.data || []);

			// Fetch direct channels
			const directChannelsResponse = await api.get('/channel/direct/userChannels');
			setDirectChannels(directChannelsResponse.data || []);
		} catch (error) {
			console.error(Resources.Sidebar.Errors.Fetch_failed + ':', error);
		} finally {
			setLoading(false);
		}
	}, [Resources.Sidebar.Errors.Fetch_failed]);

	// Expose methods to parent component
	useImperativeHandle(ref, () => ({
		refreshData: fetchUserData,
		addServer: (server: Server) => {
			setServers(prev => [...prev, server]);
		},
		addDirectChannel: (channel: DirectChannel) => {
			setDirectChannels(prev => [...prev, channel]);
		},
	}), [fetchUserData]);

	useEffect(() => {
		if (currentUser) {
			fetchUserData();
		}
	}, [currentUser, fetchUserData]);

	const handleServerPress = (server: Server) => {
		setSelectedServerId(server.id);
		setSelectedChannelId(null);
		onServerSelect?.(server);
	};

	const handleDirectChannelPress = (channelId: string) => {
		setSelectedChannelId(channelId);
		setSelectedServerId(null);
		// Find the full channel object to pass
		const channel = directChannels.find(ch => ch.id === channelId);
		if (channel) {
			onDirectChannelSelect?.(channel);
		}
	};

	if (loading) {
		return (
			<View style={[
				styles.container, 
				{ 
					backgroundColor: Colors[colorScheme ?? 'light'].background,
					borderRightColor: Colors[colorScheme ?? 'light'].border,
				}
			]}>
				<ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
				<Text style={[styles.loadingText, { color: Colors[colorScheme ?? 'light'].text }]}>
					{Resources.Sidebar.Loading}
				</Text>
			</View>
		);
	}

	return (
		<View style={[
			styles.container, 
			{ 
				backgroundColor: Colors[colorScheme ?? 'light'].background,
				borderRightColor: Colors[colorScheme ?? 'light'].border,
			}
		]}>
			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
				{/* Servers Section */}
				{servers.length > 0 && (
					<View style={styles.section}>
						<Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
							{Resources.Sidebar.Servers}
						</Text>
						{servers.map((server) => (
							<ServerItem
								key={server.id}
								server={server}
								isSelected={selectedServerId === server.id}
								onPress={handleServerPress}
							/>
						))}
					</View>
				)}

				{/* Direct Channels Section */}
				{directChannels.length > 0 && (
					<View style={styles.section}>
						<Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
							{Resources.Sidebar.Direct_Messages}
						</Text>
						{directChannels.map((channel) => (
							<DirectChannelItem
								key={channel.id}
								channel={channel}
								isSelected={selectedChannelId === channel.id}
								onPress={handleDirectChannelPress}
							/>
						))}
					</View>
				)}

				{servers.length === 0 && directChannels.length === 0 && (
					<View style={styles.emptyState}>
						<Text style={[styles.emptyStateText, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
							{Resources.Sidebar.No_content}
						</Text>
					</View>
				)}
			</ScrollView>
			
			{/* Action Buttons */}
			<SidebarActionButtons
				onAddServer={onAddServer}
				onCreateDirectMessage={onCreateDirectMessage}
				onJoinServer={onJoinServer}
			/>
			
			{/* Logout Button */}
			<TouchableOpacity 
				style={[styles.logoutButton, { backgroundColor: '#FF4444' }]} 
				onPress={handleLogout}
			>
				<Text style={[styles.logoutText, { color: '#FFFFFF' }]}>
					{Resources.Auth.Logout}
				</Text>
			</TouchableOpacity>
		</View>
	);
});

ServerSidebar.displayName = 'ServerSidebar';

export default ServerSidebar;

const styles = StyleSheet.create({
	container: {
		width: 120,
		paddingVertical: 10,
		paddingHorizontal: 8,
		justifyContent: 'flex-start',
		alignItems: 'center',
		borderRightWidth: 1,
	},
	scrollView: {
		flex: 1,
		width: '100%',
	},
	section: {
		marginBottom: 20,
		width: '100%',
	},
	sectionTitle: {
		fontSize: 10,
		fontWeight: '600',
		marginBottom: 8,
		textAlign: 'center',
		textTransform: 'uppercase',
		opacity: 0.7,
	},
	loadingText: {
		fontSize: 10,
		textAlign: 'center',
		marginTop: 8,
		fontWeight: '500',
	},
	emptyState: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 40,
		paddingHorizontal: 16,
	},
	emptyStateText: {
		fontSize: 11,
		textAlign: 'center',
		fontStyle: 'italic',
		lineHeight: 16,
	},
	logoutButton: {
		width: '100%',
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 6,
		marginTop: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	logoutText: {
		fontSize: 10,
		fontWeight: '600',
		textTransform: 'uppercase',
	},
});
