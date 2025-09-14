import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { DirectChannelItemProps } from '@/types';

export default function DirectChannelItem({
	channel,
	isSelected,
	onPress,
}: DirectChannelItemProps) {
	const colorScheme = useColorScheme();

	const getDirectChannelIcon = () => {
		return (
			<View
				style={[
					styles.directChannelIcon,
					{ backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault },
				]}
			>
				<Text
					style={[
						styles.directChannelIconText,
						{ color: Colors[colorScheme ?? 'light'].background },
					]}
				>
					{channel.name.charAt(0).toUpperCase()}
				</Text>
			</View>
		);
	};

	return (
		<TouchableOpacity
			style={[
				styles.channelItem,
				isSelected && {
					backgroundColor: Colors[colorScheme ?? 'light'].tabIconSelected + '20',
				},
			]}
			onPress={() => onPress(channel.id)}
			activeOpacity={0.7}
		>
			{getDirectChannelIcon()}
			<Text
				style={[styles.channelName, { color: Colors[colorScheme ?? 'light'].text }]}
				numberOfLines={2}
			>
				{channel.name}
			</Text>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	channelItem: {
		alignItems: 'center',
		marginBottom: 12,
		padding: 6,
		borderRadius: 12,
		position: 'relative',
	},
	directChannelIcon: {
		width: 36,
		height: 36,
		borderRadius: 18,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 4,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 1,
		},
		shadowOpacity: 0.05,
		shadowRadius: 1,
		elevation: 1,
	},
	directChannelIconText: {
		fontSize: 14,
		fontWeight: '600',
	},
	channelName: {
		fontSize: 9,
		textAlign: 'center',
		maxWidth: 96,
		fontWeight: '500',
		lineHeight: 11,
	},
});
