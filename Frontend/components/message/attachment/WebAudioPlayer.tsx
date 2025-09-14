import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';

interface WebAudioPlayerProps {
	audioUrl: string;
	fileType: string;
	onError: () => void;
	colors: any;
}

const { width: screenWidth } = Dimensions.get('window');
	
export default function WebAudioPlayer({ 
	audioUrl, 
	fileType, 
	onError,
	colors
}: WebAudioPlayerProps) {
	const styles = StyleSheet.create({
		webAudio: {
			height: 32,
			maxWidth: '100%',
			backgroundColor: colors.background,
			width: Math.min(screenWidth * 0.8, 400),
		}
	});

	return (
		<audio
			controls
			preload="metadata"
			style={styles.webAudio}
			onError={(e) => {
				console.error('Audio playback error:', e);
				onError();
			}}
		>
			<source src={audioUrl} type={fileType} />
			Your browser does not support the audio tag.
		</audio>
	);
}
