import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system';
import { API_URL } from '@/constants/env';
import { getStrings } from '@/i18n';

export interface FileDownloadOptions {
	attachment: {
		id: string;
		fileName: string;
		url: string;
		fileType: string;
		size: number;
	};
	token: string;
	serverId?: string;
	channelId: string;
}

export class FileService {
	static async downloadAndOpenFile(options: FileDownloadOptions): Promise<void> {
		const { attachment, token, serverId, channelId } = options;
		
		try {
			// Construct the URL without token in query params
			const params = new URLSearchParams({ channelId });
			
			// Only add serverId for server channels, not for direct channels
			if (serverId && serverId.trim() !== '') {
				params.append('serverId', serverId);
			}
			
			const fileUrl = `${API_URL}${attachment.url}?${params.toString()}`;
			
			// For web platform, we can still use direct linking with auth headers
			if (Platform.OS === 'web') {
				await this.downloadFileWeb(fileUrl, token, attachment.fileName);
				return;
			}
			
			// For mobile platforms, use Expo File System to download and open files
			await this.downloadFileToMobile(fileUrl, token, attachment);
			
		} catch (error) {
			console.error('File download error:', error);
			const strings = getStrings();
			Alert.alert(
				strings.FileDownload.Download_Error, 
				strings.FileDownload.Download_Failed,
				[{ text: strings.FileDownload.OK }]
			);
		}
	}

	static async downloadFileToMobile(fileUrl: string, token: string, attachment: { fileName: string; fileType: string }): Promise<void> {
		try {
			const downloadResumable = FileSystem.createDownloadResumable(
				fileUrl,
				FileSystem.cacheDirectory + attachment.fileName,
				{
					headers: {
						'Authorization': token,
						'Accept': '*/*',
					}
				},
				(downloadProgress) => {
					const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
					console.log(`Download progress: ${(progress * 100).toFixed(0)}%`);
				}
			);

			const downloadResult = await downloadResumable.downloadAsync();
			
			if (!downloadResult?.uri) {
				throw new Error('Download failed - no file URI returned');
			}

			// Check if file already exists in cache
			const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
			if (!fileInfo.exists) {
				throw new Error('Downloaded file does not exist');
			}

			await this.handleNonMediaFile(downloadResult.uri, attachment);		
			
		} catch (error) {
			console.error('Mobile download error:', error);
			const strings = getStrings();
			Alert.alert(
				strings.FileDownload.Download_Error, 
				strings.FileDownload.Download_Failed,
				[{ text: strings.FileDownload.OK }]
			);
		}
	}

	static async handleNonMediaFile(fileUri: string, attachment: { fileName: string; fileType: string }): Promise<void> {
		try {
			const strings = getStrings();

			const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();

			if (!permissions.granted) {
				Alert.alert(strings.FileDownload.Permission_Denied, strings.FileDownload.Permission_Required);
				return;
			}

			// Create a new file in the Downloads directory
			const base64 = await FileSystem.readAsStringAsync(fileUri, {
				encoding: FileSystem.EncodingType.Base64,
			});

			const newFileUri = await StorageAccessFramework.createFileAsync(
				permissions.directoryUri,
				attachment.fileName,
				attachment.fileType
			);

			// Write the file
			await FileSystem.writeAsStringAsync(newFileUri, base64, {
				encoding: FileSystem.EncodingType.Base64,
			});

			Alert.alert(
				strings.FileDownload.Download_Complete,
				`${attachment.fileName} ${strings.FileDownload.File_Downloaded_Success}`,
				[{ text: strings.FileDownload.OK }]
			);
		} catch (error) {
			console.error('Error saving file:', error);
			const strings = getStrings();
			Alert.alert(
			strings.FileDownload.Download_Complete,
			`${attachment.fileName} ${strings.FileDownload.Download_Failed}`,
			[{ text: strings.FileDownload.OK }]
			);
		}
	}

	static async downloadFileWeb(fileUrl: string, token: string, fileName: string): Promise<void> {
		try {
			// Fetch file with proper authorization headers
			const response = await fetch(fileUrl, {
				headers: {
					'Authorization': token,
					'Accept': '*/*',
				},
			});
			
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			
			// Get the file blob
			const blob = await response.blob();
			
			// Create a download link
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = fileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
			
		} catch (error) {
			console.error('Web download error:', error);
			const strings = getStrings();
			Alert.alert(
				strings.FileDownload.Download_Error, 
				strings.FileDownload.Download_Failed,
				[{ text: strings.FileDownload.OK }]
			);
		}
	}
}
