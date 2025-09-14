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
import ImageViewerModal from './ImageViewerModal';
import { ImageAttachmentProps } from '@/types/message';
import { api } from '@/services/api';

const { width: screenWidth } = Dimensions.get('window');

export default function ImageAttachment({ 
	attachment, 
	serverId, 
	channelId, 
	colors 
}: ImageAttachmentProps) {
	const [imageError, setImageError] = useState(false);
	const [imageUrl, setImageUrl] = useState<string>('');
	const [showImageModal, setShowImageModal] = useState(false);
	const { token } = useAuth();

	useEffect(() => {
		const loadImageUrl = async () => {
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
						setImageUrl(blobUrl);
					} else {
						// For mobile, convert blob to data URL
						const reader = new FileReader();
						reader.onload = () => {
							const dataUrl = reader.result as string;
							setImageUrl(dataUrl);
						};
						reader.readAsDataURL(blob);
					}
					
				} catch (error) {
					console.error('Error loading image URL:', error);
					setImageError(true);
				}
			} else {
				setImageError(true);
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
			// Use modal for both web and mobile to unify behavior
			setShowImageModal(true);
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

	console.log('ImageAttachment render: imageUrl exists:', !!imageUrl);

	return (
		<React.Fragment>
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
			
			{/* Modal will appear when showImageModal is true */}
			<ImageViewerModal
				visible={showImageModal}
				imageUrl={imageUrl}
				fileName={attachment.fileName}
				onClose={() => setShowImageModal(false)}
			/>
		</React.Fragment>
	);
}
