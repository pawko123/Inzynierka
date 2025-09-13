import React, { useState, useEffect } from 'react';
import {
	Text,
	StyleSheet,
	TouchableOpacity,
	Image,
	Dimensions,
	Platform,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import FileAttachment from './FileAttachment';
import { FileService } from '@/services/FileService';
import { ImageAttachmentProps } from '@/types/message';

const { width: screenWidth } = Dimensions.get('window');

export default function ImageAttachment({ 
	attachment, 
	serverId, 
	channelId, 
	colors 
}: ImageAttachmentProps) {
	const [imageError, setImageError] = useState(false);
	const [imageUrl, setImageUrl] = useState<string>('');
	const { token } = useAuth();

	useEffect(() => {
		const loadImageUrl = async () => {
			if (token) {
				try {
					console.log('Loading secure image URL for:', attachment.fileName, 'fileType:', attachment.fileType);
					
					// Use the secure URL approach that handles authorization properly
					const secureUrl = await FileService.getSecureFileUrl(
						attachment,
						channelId,
						token,
						serverId
					);
					console.log('Using secure URL:', secureUrl);
					setImageUrl(secureUrl);
					
				} catch (error) {
					console.error('Error loading image URL:', error);
					setImageError(true);
				}
			} else {
				console.log('No token available for image:', attachment.fileName);
			}
		};

		loadImageUrl();
	}, [attachment, channelId, token, serverId]);

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	const openImage = async () => {
		if (!token || !imageUrl) {
			console.error('No auth token or image URL available');
			return;
		}

		try {
			// For images, we want to open them in a new tab/window for viewing, not download
			if (Platform.OS === 'web') {
				// Open the secure blob URL in a new tab for viewing
				window.open(imageUrl, '_blank');
			} else {
				// For mobile, fallback to download
				await FileService.downloadAndOpenFile({
					attachment,
					token,
					serverId,
					channelId,
				});
			}
		} catch (error) {
			console.error('Error opening image:', error);
		}
	};

	const styles = StyleSheet.create({
		imageContainer: {
			marginVertical: 4,
		},
		image: {
			width: Math.min(screenWidth * 0.6, 300),
			height: 200,
			borderRadius: 12,
			borderWidth: 1,
			backgroundColor: colors.inputBackground,
		},
		fileName: {
			fontSize: 14,
			fontWeight: '500',
			marginTop: 4,
		},
	});

	if (imageError || !imageUrl) {
		// If image fails to load or URL is not ready, show as a file attachment
		return (
			<FileAttachment
				attachment={attachment}
				serverId={serverId}
				channelId={channelId}
				colors={colors}
			/>
		);
	}

	return (
		<TouchableOpacity onPress={openImage} style={styles.imageContainer}>
			<Image
				source={{ uri: imageUrl }}
				style={[styles.image, { borderColor: colors.border }]}
				resizeMode="contain"
				onError={() => setImageError(true)}
			/>
			<Text style={[styles.fileName, { color: colors.tabIconDefault }]}>
				{attachment.fileName} • {formatFileSize(attachment.size)}
			</Text>
		</TouchableOpacity>
	);
}
