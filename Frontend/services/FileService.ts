import { Alert, Platform } from 'react-native';
import { API_URL } from '@/constants/env';

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
			
			// For mobile platforms, we would use react-native-fs here
			// Since we don't have it installed, we'll show a message for now
			Alert.alert(
				'Download Feature',
				'File download with local storage will be implemented when react-native-fs is added to the project.',
				[{ text: 'OK' }]
			);
			
		} catch (error) {
			console.error('File download error:', error);
			Alert.alert('Error', 'Failed to download file');
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
			Alert.alert('Error', 'Failed to download file');
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
