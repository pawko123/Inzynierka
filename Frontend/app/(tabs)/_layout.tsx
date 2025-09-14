import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { ServerSidebar, ServerContent, JoinServerModal } from '@/components/server';
import type { ServerSidebarRef } from '@/components/server';
import WelcomeScreen from '@/components/WelcomeScreen';
import { ChannelChat } from '@/components/channel';
import CreateModal, { CreateType } from '@/components/CreateModal';
import { api } from '@/services/api';
import type { Server, DirectChannel } from '@/types/sidebar';

function GuardedTabs({ children }: { children: React.ReactNode }) {
	const { token, loading } = useAuth();
	const router = useRouter();
	
	useEffect(() => {
		if (!loading && !token) {
			router.replace('/(auth)/login');
		}
	}, [token, loading, router]);
	
	if (loading) return null;
	if (!token) return null; // Will redirect via useEffect
	return <>{children}</>;
}

export default function TabLayout() {
	const sidebarRef = useRef<ServerSidebarRef>(null);
	const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
	const [isJoinServerModalVisible, setIsJoinServerModalVisible] = useState(false);
	const [createModalType, setCreateModalType] = useState<CreateType>('server');
	const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
	const [selectedServerName, setSelectedServerName] = useState<string>('');
	const [selectedDirectChannel, setSelectedDirectChannel] = useState<DirectChannel | null>(null);

	const handleServerSelect = (server: Server) => {
		console.log('Selected server:', server);
		setSelectedServerId(server.id);
		setSelectedServerName(server.name);
		// Clear direct channel selection when selecting a server
		setSelectedDirectChannel(null);
	};

	const handleDirectChannelSelect = (channel: DirectChannel) => {
		console.log('Selected direct channel:', channel);
		// Set direct channel and clear server selection
		setSelectedDirectChannel(channel);
		setSelectedServerId(null);
		setSelectedServerName('');
	};

	const handleChannelSelect = (channelId: string) => {
		console.log('Selected channel:', channelId);
		// TODO: Navigate to channel view or update context
	};

	const handleCreateServer = () => {
		setCreateModalType('server');
		setIsCreateModalVisible(true);
	};

	const handleCreateDirectChannel = () => {
		setCreateModalType('direct-channel');
		setIsCreateModalVisible(true);
	};

	const handleJoinServer = () => {
		setIsJoinServerModalVisible(true);
	};

	const handleServerCreation = (data: any) => {
		console.log('Server created:', data);
		// Add the newly created server to the sidebar
		if (sidebarRef.current && data) {
			sidebarRef.current.addServer(data);
		}
	};

	const handleDirectChannelCreation = (data: any) => {
		console.log('Direct channel created:', data);
		// Add the newly created direct channel to the sidebar
		if (sidebarRef.current && data) {
			sidebarRef.current.addDirectChannel(data);
		}
	};

	const handleServerJoined = async (data: any) => {
		console.log('Joined server:', data);
		// For joined servers, we need to fetch the full server data and add it
		if (sidebarRef.current && data?.serverId) {
			try {
				const { data: serverData } = await api.get(`/server/getServer?serverId=${data.serverId}`);
				sidebarRef.current.addServer(serverData);
			} catch (error) {
				console.error('Failed to fetch joined server data:', error);
				// Fallback: refresh the entire sidebar
				sidebarRef.current.refreshData();
			}
		}
	};

	return (
		<GuardedTabs>
			<View style={styles.container}>
				<ServerSidebar 
					ref={sidebarRef}
					onServerSelect={handleServerSelect}
					onDirectChannelSelect={handleDirectChannelSelect}
					onAddServer={handleCreateServer}
					onCreateDirectMessage={handleCreateDirectChannel}
					onJoinServer={handleJoinServer}
				/>
				<View style={styles.mainContent}>
					{selectedServerId ? (
						<ServerContent 
							serverId={selectedServerId}
							serverName={selectedServerName}
							onChannelSelect={handleChannelSelect}
						/>
					) : selectedDirectChannel ? (
						<ChannelChat
							channel={{
								id: selectedDirectChannel.id,
								name: selectedDirectChannel.name,
								type: selectedDirectChannel.type,
								createdAt: new Date().toISOString(),
							}}
							serverId="" // Direct channels don't have a server
						/>
					) : (
						<WelcomeScreen 
							onCreateServer={handleCreateServer}
							onCreateDirectChannel={handleCreateDirectChannel}
							onJoinServer={handleJoinServer}
						/>
					)}
				</View>
			</View>

			<CreateModal
				visible={isCreateModalVisible}
				onClose={() => setIsCreateModalVisible(false)}
				defaultType={createModalType}
				onCreateServer={handleServerCreation}
				onCreateDirectChannel={handleDirectChannelCreation}
			/>

			<JoinServerModal
				visible={isJoinServerModalVisible}
				onClose={() => setIsJoinServerModalVisible(false)}
				onJoinServer={handleServerJoined}
			/>
		</GuardedTabs>
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
});
