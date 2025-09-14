import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { getStrings } from '@/i18n';
import { ServerItemProps } from '@/types';

export default function ServerItem({ server, isSelected, onPress }: ServerItemProps) {
	const colorScheme = useColorScheme();
	const Resources = getStrings();

	const getServerIcon = () => {
		if (server.logo) {
			// Handle base64 image data - try different common formats
			let imageSource = '';
			if (server.logo.startsWith('data:')) {
				// Already has data URI prefix
				imageSource = server.logo;
			} else {
				// Add data URI prefix - try PNG first, then JPEG
				imageSource = `data:image/png;base64,${server.logo}`;
			}

			return (
				<View style={styles.serverIcon}>
					<Image
						source={{ uri: imageSource }}
						style={styles.serverIconImage}
						resizeMode="cover"
						onError={() => {
							// If PNG fails, try JPEG format
							console.log(Resources.Sidebar.Errors.Icon_load_failed);
						}}
					/>
				</View>
			);
		}

		// Fallback to first letter if no logo
		return (
			<View
				style={[
					styles.serverIcon,
					{ backgroundColor: Colors[colorScheme ?? 'light'].tint },
				]}
			>
				<Text
					style={[
						styles.serverIconText,
						{ color: Colors[colorScheme ?? 'light'].background },
					]}
				>
					{server.name.charAt(0).toUpperCase()}
				</Text>
			</View>
		);
	};

	return (
		<TouchableOpacity
			style={[
				styles.serverItem,
				isSelected && {
					backgroundColor: Colors[colorScheme ?? 'light'].tabIconSelected + '20',
				},
			]}
			onPress={() => onPress(server)}
			activeOpacity={0.7}
		>
			{getServerIcon()}
			<Text
				style={[styles.tooltip, { color: Colors[colorScheme ?? 'light'].text }]}
				numberOfLines={1}
			>
				{server.name}
			</Text>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	serverItem: {
		alignItems: 'center',
		marginBottom: 12,
		padding: 6,
		borderRadius: 12,
		position: 'relative',
	},
	serverIcon: {
		width: 48,
		height: 48,
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 4,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
		overflow: 'hidden',
	},
	serverIconImage: {
		width: '100%',
		height: '100%',
		borderRadius: 16,
	},
	serverIconText: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	tooltip: {
		fontSize: 9,
		textAlign: 'center',
		maxWidth: 96,
		fontWeight: '500',
	},
});
