import { Redirect } from 'expo-router';
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import ServerSidebar from '@/components/ServerSidebar';
import WelcomeScreen from '@/components/WelcomeScreen';
import CreateModal, { CreateType } from '@/components/CreateModal';
import JoinServerModal from '@/components/JoinServerModal';

function GuardedTabs({ children }: { children: React.ReactNode }) {
	const { token, loading } = useAuth();
	if (loading) return null;
	if (!token) return <Redirect href="/(auth)/login" />;
	return <>{children}</>;
}

export default function TabLayout() {
	const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
	const [isJoinServerModalVisible, setIsJoinServerModalVisible] = useState(false);
	const [createModalType, setCreateModalType] = useState<CreateType>('server');

	const handleServerSelect = (serverId: string) => {
		console.log('Selected server:', serverId);
		// TODO: Navigate to server view or update context
	};

	const handleDirectChannelSelect = (channelId: string) => {
		console.log('Selected direct channel:', channelId);
		// TODO: Navigate to direct channel view or update context
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
					<WelcomeScreen 
						onCreateServer={handleCreateServer}
						onCreateDirectChannel={handleCreateDirectChannel}
						onJoinServer={handleJoinServer}
					/>
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
