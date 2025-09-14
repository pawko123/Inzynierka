import React, { useState, useRef } from 'react';
import {
	Modal,
	View,
	TouchableOpacity,
	Text,
	StyleSheet,
	Dimensions,
	StatusBar,
	SafeAreaView,
	Platform,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VideoViewerModalProps {
	visible: boolean;
	videoUrl: string;
	fileName: string;
	onClose: () => void;
}

export default function VideoViewerModal({ 
	visible, 
	videoUrl, 
	fileName, 
	onClose 
}: VideoViewerModalProps) {
	const video = useRef<Video>(null);
	const [status, setStatus] = useState<any>({});

	const styles = StyleSheet.create({
		modalContainer: {
			flex: 1,
			backgroundColor: 'rgba(0, 0, 0, 0.9)',
			justifyContent: 'center',
			alignItems: 'center',
		},
		header: {
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingHorizontal: 16,
			paddingTop: 16,
			paddingBottom: 12,
			backgroundColor: 'rgba(0, 0, 0, 0.7)',
			zIndex: 1,
		},
		fileName: {
			color: 'white',
			fontSize: 16,
			fontWeight: '600',
			flex: 1,
			marginRight: 16,
		},
		closeButton: {
			padding: 8,
			borderRadius: 20,
			backgroundColor: 'rgba(255, 255, 255, 0.1)',
		},
		videoContainer: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			width: '100%',
			paddingHorizontal: 20,
		},
		video: {
			width: screenWidth - 40,
			height: (screenWidth - 40) * 9 / 16, // 16:9 aspect ratio
			maxHeight: screenHeight * 0.7,
			borderRadius: 8,
		},
		controls: {
			position: 'absolute',
			bottom: 50,
			left: 20,
			right: 20,
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
			paddingVertical: 10,
			paddingHorizontal: 20,
			borderRadius: 25,
		},
		controlButton: {
			marginHorizontal: 10,
		},
		playPauseButton: {
			padding: 10,
		},
		loadingContainer: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
		},
		loadingText: {
			color: 'white',
			fontSize: 16,
		},
	});

	const togglePlayPause = () => {
		if (status.isPlaying) {
			video.current?.pauseAsync();
		} else {
			video.current?.playAsync();
		}
	};

	const handleModalClose = () => {
		if (video.current) {
			video.current.pauseAsync();
		}
		onClose();
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			statusBarTranslucent
			onRequestClose={handleModalClose}
		>
			<StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
			<SafeAreaView style={styles.modalContainer}>
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.fileName} numberOfLines={1}>
						{fileName}
					</Text>
					<TouchableOpacity onPress={handleModalClose} style={styles.closeButton}>
						<Ionicons name="close" size={24} color="white" />
					</TouchableOpacity>
				</View>

				{/* Video Player */}
				<TouchableOpacity 
					style={styles.videoContainer} 
					onPress={handleModalClose}
					activeOpacity={1}
				>
					<Video
						ref={video}
						style={styles.video}
						source={{ uri: videoUrl }}
						useNativeControls={Platform.OS === 'ios'}
						resizeMode={ResizeMode.CONTAIN}
						isLooping={false}
						onPlaybackStatusUpdate={setStatus}
						shouldPlay={false}
						onError={(error: any) => {
							console.error('Video playback error:', error);
						}}
					/>
				</TouchableOpacity>

				{/* Custom Controls for Android */}
				{Platform.OS === 'android' && (
					<View style={styles.controls}>
						<TouchableOpacity 
							style={[styles.controlButton, styles.playPauseButton]}
							onPress={togglePlayPause}
						>
							<Ionicons 
								name={status.isPlaying ? "pause" : "play"} 
								size={24} 
								color="white" 
							/>
						</TouchableOpacity>
					</View>
				)}
			</SafeAreaView>
		</Modal>
	);
}
