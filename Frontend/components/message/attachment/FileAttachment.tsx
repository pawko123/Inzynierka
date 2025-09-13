import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Dimensions,
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

interface FileAttachmentProps {
	attachment: MessageAttachmentData;
	serverId: string;
	channelId: string;
	colors: any;
}

const { width: screenWidth } = Dimensions.get('window');

export default function FileAttachment({ 
	attachment, 
	serverId, 
	channelId, 
	colors 
}: FileAttachmentProps) {
	const [downloading, setDownloading] = useState(false);
	const { token } = useAuth();

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	const downloadFile = async () => {
		if (!token) {
			console.error('No auth token available');
			return;
		}

		setDownloading(true);
		
		try {
			await FileService.downloadAndOpenFile({
				attachment,
				token,
				serverId,
				channelId,
			});
		} catch (error) {
			console.error('Download error:', error);
		} finally {
			setDownloading(false);
		}
	};

	const styles = StyleSheet.create({
		fileContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			padding: 12,
			borderRadius: 12,
			borderWidth: 1,
			marginVertical: 2,
			maxWidth: Math.min(screenWidth * 0.8, 350),
			backgroundColor: colors.card,
			borderColor: colors.border,
		},
		fileInfo: {
			flex: 1,
			marginRight: 8,
		},
		fileName: {
			fontSize: 14,
			fontWeight: '500',
			marginTop: 4,
		},
		fileSize: {
			fontSize: 12,
			marginTop: 2,
		},
		downloadText: {
			fontSize: 14,
			fontWeight: '500',
			color: colors.tint,
		},
	});

	return (
		<TouchableOpacity
			style={styles.fileContainer}
			onPress={downloadFile}
			disabled={downloading}
		>
			<View style={styles.fileInfo}>
				<Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
					📄 {attachment.fileName}
				</Text>
				<Text style={[styles.fileSize, { color: colors.tabIconDefault }]}>
					{formatFileSize(attachment.size)} • {attachment.fileType}
				</Text>
			</View>
			<Text style={styles.downloadText}>
				{downloading ? 'Downloading...' : 'Download'}
			</Text>
		</TouchableOpacity>
	);
}
