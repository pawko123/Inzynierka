import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { getStrings } from '@/i18n';
import { Button } from '@/components/ui';
import { WelcomeScreenProps } from '@/types/ui';

export default function WelcomeScreen({
	onCreateServer,
	onCreateDirectChannel,
	onJoinServer,
}: WelcomeScreenProps) {
	const colorScheme = useColorScheme();
	const Resources = getStrings();

	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: Colors[colorScheme ?? 'light'].background },
			]}
		>
			<View style={styles.content}>
				{/* Welcome Message */}
				<View style={styles.welcomeSection}>
					<Text
						style={[
							styles.welcomeTitle,
							{ color: Colors[colorScheme ?? 'light'].text },
						]}
					>
						{Resources.Welcome.Title}
					</Text>
					<Text
						style={[
							styles.welcomeSubtitle,
							{ color: Colors[colorScheme ?? 'light'].tabIconDefault },
						]}
					>
						{Resources.Welcome.Subtitle}
					</Text>
				</View>

				{/* Action Buttons */}
				<View style={styles.actionsSection}>
					<Button
						title={Resources.Welcome.Actions.Create_Server}
						onPress={onCreateServer}
						variant="primary"
						size="large"
					/>

					<Button
						title={Resources.Welcome.Actions.Join_Server}
						onPress={onJoinServer}
						variant="secondary"
						size="medium"
					/>

					<Button
						title={Resources.Welcome.Actions.Create_Direct_Channel}
						onPress={onCreateDirectChannel}
						variant="secondary"
						size="medium"
					/>
				</View>

				{/* Additional Info */}
				<View style={styles.infoSection}>
					<Text
						style={[
							styles.infoText,
							{ color: Colors[colorScheme ?? 'light'].tabIconDefault },
						]}
					>
						{Resources.Welcome.Info}
					</Text>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	content: {
		maxWidth: 400,
		width: '100%',
		alignItems: 'center',
	},
	welcomeSection: {
		marginBottom: 40,
		alignItems: 'center',
	},
	welcomeTitle: {
		fontSize: 28,
		fontWeight: 'bold',
		marginBottom: 12,
		textAlign: 'center',
	},
	welcomeSubtitle: {
		fontSize: 16,
		textAlign: 'center',
		lineHeight: 22,
	},
	actionsSection: {
		width: '100%',
		gap: 16,
		marginBottom: 40,
	},
	infoSection: {
		alignItems: 'center',
	},
	infoText: {
		fontSize: 14,
		textAlign: 'center',
		lineHeight: 20,
		fontStyle: 'italic',
	},
});
