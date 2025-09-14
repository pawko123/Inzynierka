import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
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
	static async viewMediaFile(options: FileDownloadOptions): Promise<void> {
		const { attachment, token, serverId, channelId } = options;
		
		try {
			if (Platform.OS === 'web') {
				// For web, get secure URL and open in new tab for viewing
				const secureUrl = await this.getSecureFileUrl(attachment, channelId, token, serverId);
				window.open(secureUrl, '_blank');
			} else {
				// For mobile, fallback to download and open
				await this.downloadAndOpenFile(options);
			}
		} catch (error) {
			console.error('Error viewing media file:', error);
			Alert.alert('Error', 'Failed to open media file');
		}
	}

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
			const strings = getStrings();
			
			// Request media library permission for saving files
			const { status } = await MediaLibrary.requestPermissionsAsync();
			if (status !== 'granted') {
				Alert.alert(
					strings.FileDownload.Permission_Denied, 
					strings.FileDownload.Media_Permission_Required,
					[{ text: strings.FileDownload.OK }]
				);
				return;
			}

			// Download file to cache directory first
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

			// Determine if this is a media file that should be saved to gallery
			const isMediaFile = this.isMediaFile(attachment.fileType);
			
			if (isMediaFile) {
				// Save media files to device gallery/photos
				await this.saveMediaToLibrary(downloadResult.uri, attachment);
			} else {
				// For non-media files, offer to share or open
				await this.handleNonMediaFile(downloadResult.uri, attachment);
			}
			
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

	static isMediaFile(fileType: string): boolean {
		const mediaTypes = ['image/', 'video/', 'audio/'];
		return mediaTypes.some(type => fileType.toLowerCase().startsWith(type));
	}

	static async saveMediaToLibrary(fileUri: string, attachment: { fileName: string; fileType: string }): Promise<void> {
		try {
			const strings = getStrings();
			// Save to media library (Photos app on iOS, Gallery on Android)
			await MediaLibrary.createAssetAsync(fileUri);
			
			Alert.alert(
				strings.FileDownload.Download_Complete,
				`${attachment.fileName} ${strings.FileDownload.File_Saved_Gallery}`,
				[{ text: strings.FileDownload.OK }]
			);
		} catch (error) {
			console.error('Error saving to media library:', error);
			const strings = getStrings();
			Alert.alert(
				strings.FileDownload.Download_Complete, 
				`${attachment.fileName} ${strings.FileDownload.Download_Failed_Gallery}`,
				[{ text: strings.FileDownload.OK }]
			);
		}
	}

	static async handleNonMediaFile(fileUri: string, attachment: { fileName: string; fileType: string }): Promise<void> {
		try {
			const strings = getStrings();
			Alert.alert(
				strings.FileDownload.Download_Complete,
				`${attachment.fileName} ${strings.FileDownload.File_Downloaded_Success}`,
				[{ text: strings.FileDownload.OK }]
			);
		} catch (error) {
			console.error('Error handling non-media file:', error);
			const strings = getStrings();
			Alert.alert(
				strings.FileDownload.Download_Complete, 
				`${attachment.fileName} ${strings.FileDownload.File_Downloaded}`,
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
	
	static getFileUrlForDisplay(
		attachment: { url: string },
		channelId: string,
		serverId?: string,
		token?: string
	): string {
		const params = new URLSearchParams({ channelId });
		
		// Only add serverId for server channels, not for direct channels
		if (serverId && serverId.trim() !== '') {
			params.append('serverId', serverId);
		}
		
		// Remove token from query string - use authorization headers instead
		return `${API_URL}${attachment.url}?${params.toString()}`;
	}
	
	static async getSecureFileUrl(
		attachment: { url: string },
		channelId: string,
		token: string,
		serverId?: string
	): Promise<string> {
		if (Platform.OS !== 'web') {
			// For mobile, return the regular URL with token for now
			return this.getFileUrlForDisplay(attachment, channelId, serverId, token);
		}
		
		try {
			// For web, try to fetch the file and create a blob URL
			const params = new URLSearchParams({ channelId });
			
			if (serverId && serverId.trim() !== '') {
				params.append('serverId', serverId);
			}
			
			const fileUrl = `${API_URL}${attachment.url}?${params.toString()}`;
			console.log('Fetching file from:', fileUrl);
			
			const response = await fetch(fileUrl, {
				headers: {
					'Authorization': token,
					'Accept': '*/*',
				},
			});
			
			if (!response.ok) {
				console.error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
				throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
			}
			
			const blob = await response.blob();
			console.log('Blob created:', { 
				size: blob.size, 
				type: blob.type,
				fileName: attachment.url 
			});
			
			const blobUrl = window.URL.createObjectURL(blob);
			console.log('Created secure blob URL:', blobUrl);
			
			return blobUrl;
			
		} catch (error) {
			console.error('Error creating secure file URL:', error);
			throw error; // Let the component handle the fallback
		}
	}
	
	static async getDirectFileUrl(
		attachment: { url: string },
		channelId: string,
		token: string,
		serverId?: string
	): Promise<string> {
		// This method returns the direct URL without creating a blob
		// Used as a fallback when blob URLs don't work
		const params = new URLSearchParams({ channelId });
		
		if (serverId && serverId.trim() !== '') {
			params.append('serverId', serverId);
		}
		
		return `${API_URL}${attachment.url}?${params.toString()}`;
	}
}
