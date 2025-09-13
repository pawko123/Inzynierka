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
import { FileService } from '@/services/FileService';

interface MessageAttachmentData {
	id: string;
	fileName: string;
	url: string;
	fileType: string;
	size: number;
}

interface VideoAttachmentProps {
	attachment: MessageAttachmentData;
	serverId: string;
	channelId: string;
	colors: any;
}

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
	const [useFallback, setUseFallback] = useState(false);

	useEffect(() => {
		let currentVideoUrl = '';
		
		const loadSecureVideoUrl = async () => {
			if (token) {
				try {
					console.log('Loading secure video URL for:', attachment.fileName);
					
					if (!useFallback) {
						// First try: secure blob URL
						try {
							const secureUrl = await FileService.getSecureFileUrl(
								attachment,
								channelId,
								token,
								serverId
							);
							console.log('Secure video URL loaded:', secureUrl ? 'Success' : 'Failed');
							currentVideoUrl = secureUrl;
							setVideoUrl(secureUrl);
							return;
						} catch (blobError) {
							console.log('Blob URL failed, trying fallback:', blobError);
							setUseFallback(true);
						}
					}
					
					// Fallback: direct URL (will need browser to handle auth differently)
					const directUrl = await FileService.getDirectFileUrl(
						attachment,
						channelId,
						token,
						serverId
					);
					console.log('Using direct URL fallback:', directUrl);
					currentVideoUrl = directUrl;
					setVideoUrl(directUrl);
					
				} catch (error) {
					console.error('Error loading video URL:', error);
					setVideoError(true);
				}
			}
		};

		loadSecureVideoUrl();
		
		// Cleanup blob URL when component unmounts or dependencies change
		return () => {
			if (currentVideoUrl && currentVideoUrl.startsWith('blob:')) {
				URL.revokeObjectURL(currentVideoUrl);
			}
		};
	}, [attachment, channelId, token, serverId, useFallback]);

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	const openVideo = async () => {
		if (!token) {
			console.error('No auth token available');
			return;
		}

		try {
			// For videos on web, if we have a videoUrl, open it in new tab
			// For mobile or if no videoUrl, download/open externally
			if (Platform.OS === 'web' && videoUrl && !videoError) {
				window.open(videoUrl, '_blank');
			} else {
				// Fallback to external player/download
				await FileService.downloadAndOpenFile({
					attachment,
					token,
					serverId,
					channelId,
				});
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
			<View style={styles.videoContainer}>
				<View style={[{ borderColor: colors.border }, styles.videoPlayer]}>
					<video
						controls
						preload="metadata"
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
						onLoadStart={() => {
							console.log('Video loading started');
						}}
						onCanPlay={() => {
							console.log('Video can play');
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
		);
	}

	// For mobile or if video fails to load, show clickable placeholder
	return (
		<TouchableOpacity
			style={styles.videoContainer}
			onPress={openVideo}
		>
			<View style={[styles.videoPlaceholder, { borderColor: colors.border }]}>
				<Text style={[styles.videoIcon, { color: colors.text }]}>🎥</Text>
				<Text style={[styles.videoText, { color: colors.text }]}>
					{Platform.OS === 'web' && videoError ? 'Video Preview Failed' : 'Tap to Play Video'}
				</Text>
				{!videoError && (
					<View style={styles.playButton}>
						<Text style={styles.playIcon}>▶</Text>
					</View>
				)}
			</View>
			<Text style={[styles.fileName, { color: colors.tabIconDefault }]}>
				{attachment.fileName} • {formatFileSize(attachment.size)}
			</Text>
		</TouchableOpacity>
	);
}
