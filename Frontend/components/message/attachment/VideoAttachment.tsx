import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Dimensions,
	Platform,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { VideoAttachmentProps } from '@/types/message';
import VideoViewerModal from './VideoViewerModal';
import { api } from '@/services/api';
import { getStrings } from '@/i18n';

const { width: screenWidth } = Dimensions.get('window');

export default function VideoAttachment({ 
	attachment, 
	serverId, 
	channelId, 
	colors 
}: VideoAttachmentProps) {
	const { token } = useAuth();
	const [videoError, setVideoError] = useState(false);
	const [videoUrl, setVideoUrl] = useState<string>('');
	const [showVideoModal, setShowVideoModal] = useState(false);

	useEffect(() => {
		const loadVideoUrl = async () => {
			if (token) {
				try {
					const params = new URLSearchParams({ channelId });
					if (serverId && serverId.trim() !== '') {
						params.append('serverId', serverId);
					}
					
					const response = await api.get(`${attachment.url}?${params.toString()}`, {
						responseType: 'blob'
					});
					
					const blob = response.data;
					
					if (Platform.OS === 'web') {
						// For web, create a blob URL
						const blobUrl = window.URL.createObjectURL(blob);
						setVideoUrl(blobUrl);
					} else {
						// For mobile, convert blob to data URL
						const reader = new FileReader();
						reader.onload = () => {
							const dataUrl = reader.result as string;
							setVideoUrl(dataUrl);
						};
						reader.readAsDataURL(blob);
					}
					
				} catch (error) {
					console.error('Error loading video URL:', error);
					setVideoError(true);
				}
			} else {
				setVideoError(true);
			}
		};

		loadVideoUrl();
	}, [attachment, channelId, token, serverId]);

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	const strings = getStrings();

	const openVideo = async () => {
		if (!token || !videoUrl) {
			console.error('No auth token or video URL available');
			return;
		}

		try {
			if (Platform.OS === 'web') {
				// For web, we don't need modal since we have inline video player
				return;
			} else {
				// Use modal for mobile
				setShowVideoModal(true);
			}
		} catch (error) {
			console.error('Error opening video:', error);
		}
	};

	const styles = StyleSheet.create({
		videoContainer: {
			marginVertical: 4,
		},
		videoPlayer: {
			width: Math.min(screenWidth * 0.6, 300),
			height: 200,
			borderRadius: 12,
			borderWidth: 1,
			backgroundColor: colors.background,
		},
		videoPlaceholder: {
			width: Math.min(screenWidth * 0.6, 300),
			height: 200,
			borderRadius: 12,
			borderWidth: 1,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: colors.inputBackground,
		},
		videoIcon: {
			fontSize: 48,
			marginBottom: 8,
		},
		videoText: {
			fontSize: 16,
			fontWeight: '500',
		},
		playButton: {
			position: 'absolute',
			top: '50%',
			left: '50%',
			transform: [{ translateX: -25 }, { translateY: -25 }],
			width: 50,
			height: 50,
			borderRadius: 25,
			backgroundColor: 'rgba(0,0,0,0.7)',
			justifyContent: 'center',
			alignItems: 'center',
		},
		playIcon: {
			fontSize: 20,
			color: 'white',
			marginLeft: 3, // Optical adjustment for play triangle
		},
		fileName: {
			fontSize: 14,
			fontWeight: '500',
			marginTop: 4,
		},
	});

	// For web, we can use HTML5 video
	if (Platform.OS === 'web' && !videoError && videoUrl) {
		return (
			<React.Fragment>
				<View style={styles.videoContainer}>
					<View style={[{ borderColor: colors.border }, styles.videoPlayer]}>
						<video
							controls
							preload="metadata"
							muted={false}
							style={{
								width: '100%',
								height: '100%',
								borderRadius: 12,
								backgroundColor: colors.background,
							}}
							onError={(e) => {
								console.error('Video playback error:', e);
								setVideoError(true);
							}}
							onLoadedMetadata={(e) => {
								// Ensure video is unmuted when it loads
								const video = e.target as HTMLVideoElement;
								video.muted = false;
							}}
						>
							<source src={videoUrl} type={attachment.fileType} />
							Your browser does not support the video tag.
						</video>
					</View>
					<Text style={[styles.fileName, { color: colors.tabIconDefault }]}>
						{attachment.fileName} • {formatFileSize(attachment.size)}
					</Text>
				</View>
				
				<VideoViewerModal
					visible={showVideoModal}
					videoUrl={videoUrl}
					fileName={attachment.fileName}
					onClose={() => setShowVideoModal(false)}
				/>
			</React.Fragment>
		);
	}

	// Show clickable placeholder for mobile or if video fails to load on web
	if (videoError || !videoUrl) {
		// Show error state
		return (
			<React.Fragment>
				<TouchableOpacity
					style={styles.videoContainer}
					onPress={openVideo}
					disabled={true}
				>
					<View style={[styles.videoPlaceholder, { borderColor: colors.border }]}>
						<Text style={[styles.videoIcon, { color: colors.text }]}>🎥</Text>
						<Text style={[styles.videoText, { color: colors.text }]}>
							{strings.Media.Video_Preview_Failed}
						</Text>
					</View>
					<Text style={[styles.fileName, { color: colors.tabIconDefault }]}>
						{attachment.fileName} • {formatFileSize(attachment.size)}
					</Text>
				</TouchableOpacity>
				
				<VideoViewerModal
					visible={showVideoModal}
					videoUrl={videoUrl}
					fileName={attachment.fileName}
					onClose={() => setShowVideoModal(false)}
				/>
			</React.Fragment>
		);
	}

	// For mobile with valid video URL, show clickable placeholder
	return (
		<React.Fragment>
			<TouchableOpacity
				style={styles.videoContainer}
				onPress={openVideo}
			>
				<View style={[styles.videoPlaceholder, { borderColor: colors.border }]}>
					<Text style={[styles.videoIcon, { color: colors.text }]}>🎥</Text>
					<Text style={[styles.videoText, { color: colors.text }]}>
						{strings.Media.Tap_To_Play_Video}
					</Text>
					<View style={styles.playButton}>
						<Text style={styles.playIcon}>▶</Text>
					</View>
				</View>
				<Text style={[styles.fileName, { color: colors.tabIconDefault }]}>
					{attachment.fileName} • {formatFileSize(attachment.size)}
				</Text>
			</TouchableOpacity>
			
			<VideoViewerModal
				visible={showVideoModal}
				videoUrl={videoUrl}
				fileName={attachment.fileName}
				onClose={() => setShowVideoModal(false)}
			/>
		</React.Fragment>
	);
}
