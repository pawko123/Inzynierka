import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Platform,
	Dimensions,
} from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
const { width: screenWidth } = Dimensions.get('window');

interface MobileAudioPlayerProps {
	audioUrl: string;
	onError: () => void;
	colors: any;
}

export default function MobileAudioPlayer({ 
	audioUrl, 
	onError,
	colors
}: MobileAudioPlayerProps) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [duration, setDuration] = useState(0);
	const [position, setPosition] = useState(0);
	const [volume, setVolume] = useState(1.0);
	const [isMuted, setIsMuted] = useState(false);
	const soundRef = useRef<Audio.Sound | null>(null);

	const loadAudio = useCallback(async () => {
		if (audioUrl) {
			try {
				// Unload any existing sound first
				if (soundRef.current) {
					await soundRef.current.unloadAsync();
					soundRef.current = null;
				}

				const { sound: audioSound } = await Audio.Sound.createAsync(
					{ uri: audioUrl },
					{ 
						shouldPlay: false, 
						isLooping: false,
						volume: volume,
						progressUpdateIntervalMillis: 100 // Update progress more frequently
					},
					onPlaybackStatusUpdate
				);
				soundRef.current = audioSound;
			} catch (error) {
				console.error('Error loading audio:', error);
				onError();
			}
		}
	}, [audioUrl, onError, volume]);

	const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
		if (status.isLoaded) {
			const newPosition = status.positionMillis || 0;
			const newDuration = status.durationMillis || 0;
			const newIsPlaying = status.isPlaying;
			
			setPosition(newPosition);
			setDuration(newDuration);
			setIsPlaying(newIsPlaying);
		} else {
			// If status is not loaded, reset states
			setPosition(0);
			setIsPlaying(false);
		}
	};

	const togglePlayPause = async () => {
		if (!soundRef.current) {
			await loadAudio();
			// After loading, we need to wait a bit and then try to play
			setTimeout(async () => {
				if (soundRef.current) {
					try {
						await soundRef.current.playAsync();
					} catch (error) {
						console.error('Error starting playback after load:', error);
					}
				}
			}, 100);
			return;
		}

		try {
			if (isPlaying) {
				await soundRef.current.pauseAsync();
			} else {
				await soundRef.current.playAsync();
			}
		} catch (error) {
			console.error('Error toggling playback:', error);
		}
	};

	const seekToPosition = async (seekPosition: number) => {
		if (soundRef.current && duration > 0) {
			try {
				const positionMillis = Math.max(0, Math.min(seekPosition * duration, duration));
				await soundRef.current.setPositionAsync(positionMillis);
			} catch (error) {
				console.error('Error seeking:', error);
			}
		}
	};

	const toggleMute = async () => {
		const newMutedState = !isMuted;
		setIsMuted(newMutedState);
		const newVolume = newMutedState ? 0 : 1.0;
		setVolume(newVolume);
		
		if (soundRef.current) {
			try {
				await soundRef.current.setVolumeAsync(newVolume);
			} catch (error) {
				console.error('Error toggling mute:', error);
			}
		}
	};

	const handleProgressTouch = (event: any) => {
		const { locationX, width } = event.nativeEvent;
		const progress = Math.max(0, Math.min(1, locationX / width));
		seekToPosition(progress);
	};

	const formatTime = (timeMillis: number) => {
		const seconds = Math.floor(timeMillis / 1000);
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	// Cleanup audio on unmount
	useEffect(() => {
		return () => {
			if (soundRef.current) {
				soundRef.current.unloadAsync();
			}
		};
	}, []);

	// Load audio when audioUrl changes
	useEffect(() => {
		if (audioUrl) {
			loadAudio();
		}
	}, [audioUrl, loadAudio]);

	const styles = StyleSheet.create({
		audioPlayer: {
			width: Math.min(screenWidth * 0.8, 250),
			minHeight: 70,
			borderRadius: 12,
			borderWidth: 1,
			backgroundColor: colors.background,
			paddingHorizontal: 16,
			paddingVertical: 12,
			overflow: 'hidden',
		},
		mobileAudioPlayer: {
			flex: 1,
			justifyContent: 'center',
		},
		controlsRow: {
			flexDirection: 'row',
			alignItems: 'center',
			marginBottom: 8,
		},
		mobilePlayButton: {
			width: 32,
			height: 32,
			borderRadius: 16,
			backgroundColor: colors.tint,
			justifyContent: 'center',
			alignItems: 'center',
			marginRight: 12,
			elevation: 2,
			shadowColor: '#000',
			shadowOffset: {
				width: 0,
				height: 1,
			},
			shadowOpacity: 0.2,
			shadowRadius: 2,
		},
		playIcon: {
			marginLeft: isPlaying ? 0 : 2,
		},
		progressContainer: {
			flex: 1,
			marginRight: 8,
		},
		progressWrapper: {
			height: 20,
			justifyContent: 'center',
		},
		mobileProgress: {
			height: 4,
			backgroundColor: colors.border,
			borderRadius: 2,
			position: 'relative',
			minWidth: 100, // Ensure minimum width for visibility
		},
		mobileProgressFill: {
			position: 'absolute',
			height: '100%',
			backgroundColor: colors.tint,
			borderRadius: 2,
		},
		timeContainer: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			marginTop: 2,
		},
		mobileTime: {
			fontSize: 10,
			color: colors.text,
			opacity: 0.7,
			fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
		},
		volumeButton: {
			width: 24,
			height: 24,
			justifyContent: 'center',
			alignItems: 'center',
			marginLeft: 4,
		},
	});

	return (
		<View style={[{ borderColor: colors.border }, styles.audioPlayer]}>
			<View style={styles.mobileAudioPlayer}>
				<View style={styles.controlsRow}>
					<TouchableOpacity 
						style={styles.mobilePlayButton}
						onPress={togglePlayPause}
						activeOpacity={0.7}
					>
						<Ionicons 
							name={isPlaying ? "pause" : "play"} 
							size={16} 
							color="white" 
							style={styles.playIcon}
						/>
					</TouchableOpacity>
					
					<View style={styles.progressContainer}>
						<TouchableOpacity 
							style={styles.progressWrapper}
							onPress={handleProgressTouch}
							activeOpacity={0.8}
						>
							<View style={styles.mobileProgress}>
								<View 
									style={[
										styles.mobileProgressFill, 
										{ 
											width: duration > 0 ? `${Math.max(0, Math.min(100, (position / duration) * 100))}%` : '0%' 
										}
									]} 
								/>
							</View>
						</TouchableOpacity>
						
						<View style={styles.timeContainer}>
							<Text style={styles.mobileTime}>
								{formatTime(position)}
							</Text>
							<Text style={styles.mobileTime}>
								{formatTime(duration)}
							</Text>
						</View>
					</View>
					
					<TouchableOpacity 
						style={styles.volumeButton}
						onPress={toggleMute}
					>
						<Ionicons 
							name={isMuted ? "volume-mute" : "volume-high"} 
							size={16} 
							color={colors.text} 
						/>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}
