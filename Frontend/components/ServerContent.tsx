import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { getStrings } from '@/i18n';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import CreateChannelModal from './CreateChannelModal';
import { translateError } from '@/utils/errorTranslator';

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
				permissions: ['MANAGE_SERVER']
			});
			setCanManageServer(data.MANAGE_SERVER || false);
		} catch (err: any) {
			console.error('Error checking user permissions:', err);
			// If we can't check permissions, assume they don't have them for safety
			setCanManageServer(false);
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

	const renderChannelItem = ({ item }: { item: Channel }) => (
		<TouchableOpacity
			style={[styles.channelItem, { backgroundColor: colors.background }]}
			onPress={() => handleChannelPress(item)}
		>
			<View style={styles.channelIcon}>
				<Text style={[styles.channelIconText, { color: colors.text }]}>
					{item.type === 'voice' ? '🔊' : '#'}
				</Text>
			</View>
			<Text style={[styles.channelName, { color: colors.text }]}>
				{item.name}
			</Text>
		</TouchableOpacity>
	);

	const renderEmptyState = () => (
		<View style={styles.emptyState}>
			<Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
				{Resources.ServerContent.No_Channels}
			</Text>
		</View>
	);

	return (
		<>
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				{/* Channel Sidebar */}
				<View style={[styles.channelSidebar, { backgroundColor: colors.background, borderRightColor: colors.border }]}>
					{/* Server Header */}
					<View style={[styles.serverHeader, { borderBottomColor: colors.border }]}>
						<Text style={[styles.serverName, { color: colors.text }]}>
							{serverName || 'Server'}
						</Text>
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
						<Text style={[styles.errorText, { color: colors.text }]}>
							{error}
						</Text>
						<TouchableOpacity
							style={[styles.retryButton, { backgroundColor: colors.tint }]}
							onPress={fetchServerChannels}
						>
							<Text style={styles.retryButtonText}>
								{Resources.ServerContent.Retry}
							</Text>
						</TouchableOpacity>
					</View>
				) : (
					<View style={styles.channelsContainer}>
						{/* Text Channels Section */}
						<View style={styles.channelSection}>
							<View style={styles.sectionHeader}>
								<Text style={[styles.sectionTitle, { color: colors.tabIconDefault }]}>
									{Resources.ServerContent.Text_Channels}
								</Text>
								{canManageServer && (
									<TouchableOpacity
										style={styles.addChannelButton}
										onPress={handleCreateChannel}
									>
										<Text style={[styles.addChannelButtonText, { color: colors.tabIconDefault }]}>
											+
										</Text>
									</TouchableOpacity>
								)}
							</View>
							<FlatList
								data={channels.filter(channel => channel.type !== 'voice')}
								renderItem={renderChannelItem}
								keyExtractor={(item) => item.id}
								ListEmptyComponent={renderEmptyState}
								showsVerticalScrollIndicator={false}
							/>
						</View>

						{/* Voice Channels Section */}
						<View style={styles.channelSection}>
							<View style={styles.sectionHeader}>
								<Text style={[styles.sectionTitle, { color: colors.tabIconDefault }]}>
									{Resources.ServerContent.Voice_Channels}
								</Text>
								{canManageServer && (
									<TouchableOpacity
										style={styles.addChannelButton}
										onPress={handleCreateChannel}
									>
										<Text style={[styles.addChannelButtonText, { color: colors.tabIconDefault }]}>
											+
										</Text>
									</TouchableOpacity>
								)}
							</View>
							<FlatList
								data={channels.filter(channel => channel.type === 'voice')}
								renderItem={renderChannelItem}
								keyExtractor={(item) => item.id}
								ListEmptyComponent={renderEmptyState}
								showsVerticalScrollIndicator={false}
							/>
						</View>
					</View>
				)}
			</View>

			{/* Main Content Area */}
			<View style={[styles.mainContent, { backgroundColor: colors.background }]}>
				<View style={styles.welcomeContainer}>
					<Text style={[styles.welcomeText, { color: colors.tabIconDefault }]}>
						{Resources.ServerContent.Select_Channel}
					</Text>
				</View>
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
	channelSidebar: {
		width: 240,
		borderRightWidth: 1,
	},
	serverHeader: {
		padding: 16,
		borderBottomWidth: 1,
	},
	serverName: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	channelsContainer: {
		flex: 1,
		padding: 8,
	},
	channelSection: {
		marginBottom: 16,
	},
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 8,
		marginBottom: 4,
	},
	sectionTitle: {
		fontSize: 12,
		fontWeight: '600',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	addChannelButton: {
		width: 20,
		height: 20,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 2,
	},
	addChannelButtonText: {
		fontSize: 16,
		fontWeight: 'bold',
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
	channelItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 6,
		paddingHorizontal: 8,
		borderRadius: 4,
		marginBottom: 1,
	},
	channelIcon: {
		width: 16,
		alignItems: 'center',
		marginRight: 6,
	},
	channelIconText: {
		fontSize: 14,
		fontWeight: '500',
	},
	channelName: {
		fontSize: 14,
		flex: 1,
	},
	emptyState: {
		paddingVertical: 20,
		alignItems: 'center',
	},
	emptyText: {
		fontSize: 12,
		textAlign: 'center',
	},
});
