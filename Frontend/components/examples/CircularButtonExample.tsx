import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@/components/ui';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Example usage of circular buttons for sidebar actions
export default function SidebarActions() {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];

	const handleAddServer = () => {
		console.log('Add server clicked');
		// TODO: Navigate to add server screen
	};

	const handleCreateDirectMessage = () => {
		console.log('Create direct message clicked');
		// TODO: Navigate to create DM screen
	};

	// Example of using icons with the circular button
	const PlusIcon = () => (
		<Text style={{ fontSize: 16, color: colors.tint, fontWeight: 'bold' }}>+</Text>
	);

	const MessageIcon = () => (
		<Text style={{ fontSize: 14, color: colors.tint }}>@</Text>
	);

	return (
		<View style={styles.container}>
			<Text style={[styles.title, { color: colors.text }]}>Circular Button Examples:</Text>
			
			<View style={styles.buttonRow}>
				{/* Add Server Button */}
				<Button
					onPress={handleAddServer}
					variant="circular"
					size="medium"
					isCircular={true}
					icon={<PlusIcon />}
					style={styles.circularButton}
				/>
				
				{/* Create Direct Message Button */}
				<Button
					onPress={handleCreateDirectMessage}
					variant="circular"
					size="medium"
					isCircular={true}
					icon={<MessageIcon />}
					style={styles.circularButton}
				/>
			</View>

			{/* Different sizes */}
			<View style={styles.buttonRow}>
				<Button
					onPress={() => console.log('Small circular')}
					variant="circular"
					size="small"
					isCircular={true}
					icon={<Text style={{ fontSize: 12, color: colors.tint }}>S</Text>}
				/>
				<Button
					onPress={() => console.log('Medium circular')}
					variant="circular"
					size="medium"
					isCircular={true}
					icon={<Text style={{ fontSize: 14, color: colors.tint }}>M</Text>}
				/>
				<Button
					onPress={() => console.log('Large circular')}
					variant="circular"
					size="large"
					isCircular={true}
					icon={<Text style={{ fontSize: 16, color: colors.tint }}>L</Text>}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 20,
		gap: 16,
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	buttonRow: {
		flexDirection: 'row',
		gap: 12,
		alignItems: 'center',
	},
	circularButton: {
		marginHorizontal: 4,
	},
});
