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
import { AudioAttachmentProps } from '@/types/message';
import { api } from '@/services/api';
import { getStrings } from '@/i18n';
import WebAudioPlayer from './WebAudioPlayer';
import MobileAudioPlayer from './MobileAudioPlayer';

const { width: screenWidth } = Dimensions.get('window');

export default function AudioAttachment({ 
	attachment, 
	serverId, 
	channelId, 
	colors 
}: AudioAttachmentProps) {
	const { token } = useAuth();
	const [audioError, setAudioError] = useState(false);
	const [audioUrl, setAudioUrl] = useState<string>('');

	useEffect(() => {
		const loadAudioUrl = async () => {
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
						setAudioUrl(blobUrl);
					} else {
						// For mobile, convert blob to data URL
						const reader = new FileReader();
						reader.onload = () => {
							const dataUrl = reader.result as string;
							setAudioUrl(dataUrl);
						};
						reader.readAsDataURL(blob);
					}
					
				} catch (error) {
					console.error('Error loading audio URL:', error);
					setAudioError(true);
				}
			} else {
				setAudioError(true);
			}
		};

		loadAudioUrl();
	}, [attachment, channelId, token, serverId]);

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	const strings = getStrings();

	const openAudio = async () => {
		if (!token || !audioUrl) {
			console.error('No auth token or audio URL available');
			return;
		}
	};

	const styles = StyleSheet.create({
		audioPlaceholder: {
			width: Math.min(screenWidth * 0.8, 400),
			minHeight: 70, // Reduced from 90 to match audioPlayer
			borderRadius: 12,
			borderWidth: 1,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: colors.inputBackground,
			flexDirection: 'row',
			paddingHorizontal: 16,
		},
		audioIcon: {
			fontSize: 20,
			marginRight: 12,
			color: colors.tint,
		},
		audioInfo: {
			flex: 1,
		},
		audioText: {
			fontSize: 14,
			fontWeight: '500',
		},
		playButton: {
			width: 40,
			height: 40,
			borderRadius: 20,
			backgroundColor: colors.tint,
			justifyContent: 'center',
			alignItems: 'center',
			marginLeft: 8,
		},
		playIcon: {
			fontSize: 16,
			color: 'white',
			marginLeft: 2, // Optical adjustment for play triangle
		},
		fileName: {
			fontSize: 12,
			fontWeight: '400',
			marginTop: 4,
			opacity: 0.7,
		},
	});

	// Unified audio player for both web and mobile
	if (!audioError && audioUrl) {
		return (
			<React.Fragment>
				<View>
						{Platform.OS === 'web' ? (
							<WebAudioPlayer
								audioUrl={audioUrl}
								fileType={attachment.fileType}
								onError={() => setAudioError(true)}
								colors={colors}
							/>
						) : (
							<MobileAudioPlayer
								audioUrl={audioUrl}
								onError={() => setAudioError(true)}
								colors={colors}
							/>
						)}
					<Text style={[styles.fileName, { color: colors.text, opacity: 0.7 }]}>
						{attachment.fileName} • {formatFileSize(attachment.size)}
					</Text>
				</View>
			</React.Fragment>
		);
	}

	// Show error state
	return (
		<React.Fragment>
			<TouchableOpacity
				onPress={openAudio}
				disabled={true}
			>
				<View style={[styles.audioPlaceholder, { borderColor: colors.border }]}>
					<Text style={styles.audioIcon}>🎵</Text>
					<View style={styles.audioInfo}>
						<Text style={[styles.audioText, { color: colors.text }]}>
							{strings.Media.Audio_Preview_Failed}
						</Text>
					</View>
				</View>
				<Text style={[styles.fileName, { color: colors.text, opacity: 0.7 }]}>
					{attachment.fileName} • {formatFileSize(attachment.size)}
				</Text>
			</TouchableOpacity>
		</React.Fragment>
	);
}
