import React from 'react';
import {
	Modal,
	View,
	TouchableOpacity,
	Image,
	Text,
	StyleSheet,
	Dimensions,
	StatusBar,
	SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ImageViewerModalProps {
	visible: boolean;
	imageUrl: string;
	fileName: string;
	onClose: () => void;
}

export default function ImageViewerModal({ 
	visible, 
	imageUrl, 
	fileName, 
	onClose 
}: ImageViewerModalProps) {
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
		imageContainer: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			width: '100%',
		},
		image: {
			width: screenWidth,
			height: screenHeight * 0.8,
			borderRadius: 8,
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

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			statusBarTranslucent
			onRequestClose={onClose}
		>
			<StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
			<SafeAreaView style={styles.modalContainer}>
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.fileName} numberOfLines={1}>
						{fileName}
					</Text>
					<TouchableOpacity onPress={onClose} style={styles.closeButton}>
						<Ionicons name="close" size={24} color="white" />
					</TouchableOpacity>
				</View>

				{/* Image */}
				<TouchableOpacity 
					style={styles.imageContainer} 
					onPress={onClose}
					activeOpacity={1}
				>
					<Image
						source={{ uri: imageUrl }}
						style={styles.image}
						resizeMode="contain"
					/>
				</TouchableOpacity>
			</SafeAreaView>
		</Modal>
	);
}
