import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { getStrings } from '@/i18n';
import { Channel } from '@/types/server';

interface ChannelSectionProps {
	title: string;
	channels: Channel[];
	canManageServer: boolean;
	onChannelPress: (channel: Channel) => void;
	onAddChannel: () => void;
}

export default function ChannelSection({
	title,
	channels,
	canManageServer,
	onChannelPress,
	onAddChannel,
}: ChannelSectionProps) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];
	const Resources = getStrings();

	const renderChannelItem = ({ item }: { item: Channel }) => (
		<TouchableOpacity
			style={[styles.channelItem, { backgroundColor: colors.background }]}
			onPress={() => onChannelPress(item)}
		>
			<View style={styles.channelIcon}>
				<Text style={[styles.channelIconText, { color: colors.text }]}>
					{item.type === 'voice' ? '🔊' : '#'}
				</Text>
			</View>
			<Text style={[styles.channelName, { color: colors.text }]}>
				{item.name}
			</Text>
		</TouchableOpacity>
	);

	const renderEmptyState = () => (
		<View style={styles.emptyState}>
			<Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
				{Resources.ServerContent.No_Channels}
			</Text>
		</View>
	);

	return (
		<View style={styles.channelSection}>
			<View style={styles.sectionHeader}>
				<Text style={[styles.sectionTitle, { color: colors.tabIconDefault }]}>
					{title}
				</Text>
				{canManageServer && (
					<TouchableOpacity
						style={styles.addChannelButton}
						onPress={onAddChannel}
					>
						<Text style={[styles.addChannelButtonText, { color: colors.tabIconDefault }]}>
							+
						</Text>
					</TouchableOpacity>
				)}
			</View>
			<FlatList
				data={channels}
				renderItem={renderChannelItem}
				keyExtractor={(item) => item.id}
				ListEmptyComponent={renderEmptyState}
				showsVerticalScrollIndicator={false}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	channelSection: {
		marginBottom: 16,
	},
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 8,
		marginBottom: 4,
	},
	sectionTitle: {
		fontSize: 12,
		fontWeight: '600',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	addChannelButton: {
		width: 20,
		height: 20,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 2,
	},
	addChannelButtonText: {
		fontSize: 16,
		fontWeight: 'bold',
	},
	channelItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 6,
		paddingHorizontal: 8,
		borderRadius: 4,
		marginBottom: 1,
	},
	channelIcon: {
		width: 16,
		alignItems: 'center',
		marginRight: 6,
	},
	channelIconText: {
		fontSize: 14,
		fontWeight: '500',
	},
	channelName: {
		fontSize: 14,
		flex: 1,
	},
	emptyState: {
		paddingVertical: 20,
		alignItems: 'center',
	},
	emptyText: {
		fontSize: 12,
		textAlign: 'center',
	},
});
