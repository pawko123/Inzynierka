import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Alert,
	Dimensions,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { webRTCService } from '@/services/WebRTCService';
import { VoiceUser } from '@/types/webrtc';
import { WebRTCVideoView } from './WebRTCVideoView';
import { getStrings } from '@/i18n';

interface VoiceChannelInterfaceProps {
	channelId: string;
	channelName: string;
}

export default function VoiceChannelInterface({ channelId, channelName }: VoiceChannelInterfaceProps) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];
	const screenDimensions = Dimensions.get('window');
	const strings = getStrings();

	const [isInCall, setIsInCall] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const [isCameraOn, setIsCameraOn] = useState(false);
	const [connectedUsers, setConnectedUsers] = useState<VoiceUser[]>([]);
	const [localStream, setLocalStream] = useState<any>(null);

	const handleJoinCall = async () => {
		try {
			await webRTCService.joinVoiceChannel(channelId, {
				onUserJoined: (user: VoiceUser) => {
					setConnectedUsers(prev => [...prev.filter(u => u.userId !== user.userId), user]);
				},
				onUserLeft: (userId: string) => {
					setConnectedUsers(prev => prev.filter(u => u.userId !== userId));
				},
				onUserUpdated: (user: Partial<VoiceUser> & { userId: string }) => {
					setConnectedUsers(prev => prev.map(u => 
						u.userId === user.userId ? { ...u, ...user } : u
					));
				},
				onStreamReceived: (userId: string, stream) => {
					if (userId === 'local') {
						setLocalStream(stream);
					}
					setConnectedUsers(prev => prev.map(u => 
						u.userId === userId ? { ...u, stream } : u
					));
				},
				onStreamRemoved: (userId: string) => {
					setConnectedUsers(prev => prev.map(u => 
						u.userId === userId ? { ...u, stream: undefined } : u
					));
				},
				onError: (error: string) => {
					console.error('WebRTC error:', error);
					Alert.alert(strings.WebRTC.Error, error);
				},
			});
			setIsInCall(true);
		} catch (error) {
			console.error('Failed to join voice channel:', error);
			Alert.alert(strings.WebRTC.Error, strings.WebRTC.Failed_To_Join);
		}
	};

	const handleLeaveCall = async () => {
		try {
			await webRTCService.leaveVoiceChannel();
			setIsInCall(false);
			setLocalStream(null);
			setConnectedUsers([]);
		} catch (error) {
			console.error('Failed to leave voice channel:', error);
		}
	};

	const toggleMute = async () => {
		try {
			await webRTCService.toggleMute();
			setIsMuted(!isMuted);
		} catch (error) {
			console.error('Failed to toggle mute:', error);
		}
	};

	const toggleCamera = async () => {
		try {
			await webRTCService.toggleCamera();
			setIsCameraOn(!isCameraOn);
		} catch (error) {
			console.error('Failed to toggle camera:', error);
		}
	};

	const renderVideoGrid = () => {
		const videoStreams = [];
		
		if (localStream && isCameraOn) {
			videoStreams.push({
				userId: 'local',
				stream: localStream,
				username: 'You',
				isMuted,
			});
		}

		connectedUsers.forEach(user => {
			if (user.stream && user.isCameraOn) {
				videoStreams.push({
					userId: user.userId,
					stream: user.stream,
					username: user.username,
					isMuted: user.isMuted,
				});
			}
		});

		if (videoStreams.length === 0) {
			return null;
		}

		const itemsPerRow = videoStreams.length === 1 ? 1 : videoStreams.length <= 4 ? 2 : 3;
		const videoWidth = (screenDimensions.width - 40 - (itemsPerRow - 1) * 10) / itemsPerRow;
		const videoHeight = videoWidth * 0.75;

		return (
			<View style={styles.videoGrid}>
				{videoStreams.map((videoStream) => (
					<View key={videoStream.userId} style={[styles.videoContainer, { width: videoWidth, height: videoHeight }]}>
						<WebRTCVideoView
							stream={videoStream.stream}
							style={styles.rtcView}
							mirror={videoStream.userId === 'local'}
							username={videoStream.username}
							isMuted={videoStream.isMuted}
							colors={colors}
						/>
						<View style={[styles.userOverlay, { backgroundColor: colors.background + '80' }]}>
							<Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
								{videoStream.username}
							</Text>
							{videoStream.isMuted && (
								<Ionicons name="mic-off" size={16} color={colors.text} />
							)}
						</View>
					</View>
				))}
			</View>
		);
	};

	const renderAudioOnlyUsers = () => {
		const audioOnlyUsers = connectedUsers.filter(user => !user.isCameraOn);
		
		if (audioOnlyUsers.length === 0 && (isCameraOn || !isInCall)) {
			return null;
		}

		const allAudioUsers = [...audioOnlyUsers];
		if (isInCall && !isCameraOn) {
			allAudioUsers.unshift({
				userId: 'local',
				username: 'You',
				isMuted,
				isCameraOn: false,
				stream: undefined,
			});
		}

		return (
			<View style={styles.audioUsersContainer}>
				<Text style={[styles.sectionTitle, { color: colors.text }]}>{strings.WebRTC.Voice_Participants}</Text>
				<ScrollView horizontal showsHorizontalScrollIndicator={false}>
					{allAudioUsers.map((user) => (
						<View key={user.userId} style={[styles.audioUserItem, { backgroundColor: colors.background }]}>
							<View style={[styles.avatar, { backgroundColor: colors.tint }]}>
								<Text style={[styles.avatarText, { color: colors.background }]}>
									{user.username.charAt(0).toUpperCase()}
								</Text>
							</View>
							<Text style={[styles.audioUsername, { color: colors.text }]} numberOfLines={1}>
								{user.username}
							</Text>
							{user.isMuted && (
								<Ionicons name="mic-off" size={14} color={colors.text} style={styles.muteIcon} />
							)}
						</View>
					))}
				</ScrollView>
			</View>
		);
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<View style={[styles.header, { borderBottomColor: colors.border }]}>
				<Ionicons name="volume-high" size={24} color={colors.tint} />
				<Text style={[styles.channelName, { color: colors.text }]}>{channelName}</Text>
			</View>

			<ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
				{renderVideoGrid()}
				{renderAudioOnlyUsers()}
			</ScrollView>

			<View style={[styles.controls, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
				{isInCall ? (
					<>
						<TouchableOpacity
							style={[styles.controlButton, { backgroundColor: isMuted ? colors.destructive : colors.tint }]}
							onPress={toggleMute}
						>
							<Ionicons
								name={isMuted ? "mic-off" : "mic"}
								size={24}
								color={colors.background}
							/>
						</TouchableOpacity>

						<TouchableOpacity
							style={[styles.controlButton, { backgroundColor: isCameraOn ? colors.tint : colors.border }]}
							onPress={toggleCamera}
						>
							<Ionicons
								name={isCameraOn ? "videocam" : "videocam-off"}
								size={24}
								color={colors.background}
							/>
						</TouchableOpacity>

						<TouchableOpacity
							style={[styles.controlButton, styles.leaveButton, { backgroundColor: colors.destructive }]}
							onPress={handleLeaveCall}
						>
							<Ionicons name="call" size={24} color={colors.background} />
						</TouchableOpacity>
					</>
				) : (
					<TouchableOpacity
						style={[styles.controlButton, styles.joinButton, { backgroundColor: colors.tint }]}
						onPress={handleJoinCall}
					>
						<Ionicons name="call" size={24} color={colors.background} />
						<Text style={[styles.joinButtonText, { color: colors.background }]}>{strings.WebRTC.Join_Call}</Text>
					</TouchableOpacity>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		borderBottomWidth: 1,
	},
	channelName: {
		fontSize: 18,
		fontWeight: '600',
		marginLeft: 8,
	},
	content: {
		flex: 1,
	},
	contentContainer: {
		padding: 16,
	},
	videoGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		marginBottom: 20,
	},
	videoContainer: {
		borderRadius: 8,
		overflow: 'hidden',
		marginBottom: 10,
		position: 'relative',
	},
	rtcView: {
		width: '100%',
		height: '100%',
	},
	userOverlay: {
		position: 'absolute',
		bottom: 8,
		left: 8,
		right: 8,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
	},
	username: {
		fontSize: 12,
		fontWeight: '500',
		flex: 1,
	},
	audioUsersContainer: {
		marginTop: 20,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 12,
	},
	audioUserItem: {
		alignItems: 'center',
		marginRight: 16,
		padding: 12,
		borderRadius: 8,
		minWidth: 80,
	},
	avatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 8,
	},
	avatarText: {
		fontSize: 18,
		fontWeight: '600',
	},
	audioUsername: {
		fontSize: 12,
		textAlign: 'center',
		maxWidth: 60,
	},
	muteIcon: {
		position: 'absolute',
		top: 8,
		right: 8,
	},
	controls: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 16,
		borderTopWidth: 1,
		gap: 12,
	},
	controlButton: {
		width: 56,
		height: 56,
		borderRadius: 28,
		alignItems: 'center',
		justifyContent: 'center',
	},
	joinButton: {
		flexDirection: 'row',
		width: 'auto',
		paddingHorizontal: 24,
		gap: 8,
	},
	joinButtonText: {
		fontSize: 16,
		fontWeight: '600',
	},
	leaveButton: {
		transform: [{ rotate: '135deg' }],
	},
});