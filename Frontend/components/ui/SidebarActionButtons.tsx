import React from 'react';
import { View, StyleSheet } from 'react-native';
import Button from './Button';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SidebarActionsProps } from '@/types';

export default function SidebarActionButtons({ onAddServer, onCreateDirectMessage, onJoinServer }: SidebarActionsProps) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];

	const PlusIcon = () => (
		<View style={styles.iconContainer}>
			<View style={[styles.plusHorizontal, { backgroundColor: colors.tint }]} />
			<View style={[styles.plusVertical, { backgroundColor: colors.tint }]} />
		</View>
	);

	const MessageIcon = () => (
		<View style={[styles.messageIcon, { borderColor: colors.tint }]}>
			<View style={[styles.messageIconDot, { backgroundColor: colors.tint }]} />
		</View>
	);

	const JoinIcon = () => (
		<View style={[styles.joinIcon, { borderColor: colors.tint }]}>
			<View style={[styles.joinArrow, { backgroundColor: colors.tint }]} />
		</View>
	);

	return (
		<View style={styles.container}>
			{/* Create buttons row */}
			<View style={styles.createButtonsRow}>
				{/* Add Server Button */}
				<Button
					onPress={onAddServer || (() => console.log('Add server'))}
					variant="outline"
					size="medium"
					isCircular={true}
					icon={<PlusIcon />}
				/>
				
				{/* Create Direct Message Button */}
				<Button
					onPress={onCreateDirectMessage || (() => console.log('Create DM'))}
					variant="outline"
					size="medium"
					isCircular={true}
					icon={<MessageIcon />}
				/>
			</View>
			
			{/* Join Server Button - below create buttons */}
			<Button
				onPress={onJoinServer || (() => console.log('Join server'))}
				variant="outline"
				size="medium"
				isCircular={true}
				icon={<JoinIcon />}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'column',
		gap: 8,
		paddingHorizontal: 8,
		paddingVertical: 12,
		justifyContent: 'center',
		alignItems: 'center',
	},
	createButtonsRow: {
		flexDirection: 'row',
		gap: 8,
		justifyContent: 'center',
	},
	iconContainer: {
		width: 16,
		height: 16,
		justifyContent: 'center',
		alignItems: 'center',
		position: 'relative',
	},
	plusHorizontal: {
		width: 12,
		height: 2,
		position: 'absolute',
	},
	plusVertical: {
		width: 2,
		height: 12,
		position: 'absolute',
	},
	messageIcon: {
		width: 14,
		height: 10,
		borderWidth: 1.5,
		borderRadius: 2,
		justifyContent: 'center',
		alignItems: 'center',
		position: 'relative',
	},
	messageIconDot: {
		width: 2,
		height: 2,
		borderRadius: 1,
	},
	joinIcon: {
		width: 14,
		height: 14,
		borderWidth: 1.5,
		borderRadius: 7,
		justifyContent: 'center',
		alignItems: 'center',
		position: 'relative',
	},
	joinArrow: {
		width: 6,
		height: 2,
		borderRadius: 1,
	},
});
