import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { ServerSidebar, ServerContent, JoinServerModal } from '@/components/server';
import WelcomeScreen from '@/components/WelcomeScreen';
import { ChannelChat } from '@/components/channel';
import CreateModal, { CreateType } from '@/components/CreateModal';
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
		// TODO: Refresh sidebar or update context with new server
	};

	const handleDirectChannelCreation = (data: any) => {
		console.log('Direct channel created:', data);
		// TODO: Refresh sidebar or update context with new channel
	};

	const handleServerJoined = (data: any) => {
		console.log('Joined server:', data);
		// TODO: Refresh sidebar or update context with joined server
	};

	return (
		<GuardedTabs>
			<View style={styles.container}>
				<ServerSidebar 
					onServerSelect={handleServerSelect}
					onDirectChannelSelect={handleDirectChannelSelect}
					onAddServer={handleCreateServer}
					onCreateDirectMessage={handleCreateDirectChannel}
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
