import React, { useEffect, useState } from 'react';
import { Platform, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStrings } from '@/i18n';

interface WebRTCVideoViewProps {
	stream: any;
	style: any;
	mirror?: boolean;
	username: string;
	isMuted: boolean;
	colors: any;
}

export const WebRTCVideoView: React.FC<WebRTCVideoViewProps> = ({
	stream,
	style,
	mirror = false,
	username,
	isMuted,
	colors,
}) => {
	const [RTCView, setRTCView] = useState<any>(null);
	const [isReady, setIsReady] = useState(false);
	const strings = getStrings();

	useEffect(() => {
		if (Platform.OS === 'web') {
			setIsReady(true);
			return;
		}

		const loadRTCView = async () => {
			try {
				const webRTCModule = await import('react-native-webrtc');
				setRTCView(() => webRTCModule.RTCView);
				setIsReady(true);
			} catch (error) {
				console.warn('React Native WebRTC not available:', error);
				setIsReady(true);
			}
		};

		loadRTCView();
	}, []);

	if (!isReady) {
		return (
			<View style={[style, { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }]}>
				<Text style={{ color: colors.text }}>{strings.WebRTC.Loading}</Text>
			</View>
		);
	}

	if (Platform.OS === 'web') {
		return (
			<video
				ref={(video) => {
					if (video && stream) {
						video.srcObject = stream;
					}
				}}
				style={{ width: '100%', height: '100%', borderRadius: 8 }}
				autoPlay
				muted={mirror}
			/>
		);
	}

	if (RTCView && stream) {
		const streamURL = stream.toURL ? stream.toURL() : stream;
		return (
			<RTCView
				streamURL={streamURL}
				style={style}
				mirror={mirror}
			/>
		);
	}

	return (
		<View style={[style, { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }]}>
			<Ionicons name="videocam-off" size={48} color={colors.text} />
			<Text style={{ color: colors.text, marginTop: 8, fontSize: 12 }}>{strings.WebRTC.Video_Unavailable}</Text>
		</View>
	);
};