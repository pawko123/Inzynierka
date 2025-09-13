import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { getStrings } from '@/i18n';
import { ServerManagementProps } from '@/types/ui';

export default function ServerManagement({
	serverId,
	serverName,
	canManageServer,
	onManageRoles,
	onCreateInvite,
	onServerSettings,
}: ServerManagementProps) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];
	const Resources = getStrings();

	if (!canManageServer) {
		return null; // Don't show management options if user doesn't have permissions
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<Text style={[styles.title, { color: colors.text }]}>
				{Resources.ServerManagement.Title}
			</Text>
			
			<View style={styles.buttonContainer}>
				<TouchableOpacity
					style={[styles.managementButton, { backgroundColor: colors.tint }]}
					onPress={onManageRoles}
				>
					<Text style={[styles.buttonIcon, { color: colors.background }]}>
						👥
					</Text>
					<Text style={[styles.buttonText, { color: colors.background }]}>
						{Resources.ServerManagement.Manage_Roles}
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.managementButton, { backgroundColor: colors.tint }]}
					onPress={onCreateInvite}
				>
					<Text style={[styles.buttonIcon, { color: colors.background }]}>
						🔗
					</Text>
					<Text style={[styles.buttonText, { color: colors.background }]}>
						{Resources.ServerManagement.Create_Invite}
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.managementButton, { backgroundColor: colors.tint }]}
					onPress={onServerSettings}
				>
					<Text style={[styles.buttonIcon, { color: colors.background }]}>
						⚙️
					</Text>
					<Text style={[styles.buttonText, { color: colors.background }]}>
						{Resources.ServerManagement.Server_Settings}
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
		gap: 12,
	},
	title: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 8,
	},
	buttonContainer: {
		gap: 8,
	},
	managementButton: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		borderRadius: 8,
		gap: 12,
	},
	buttonIcon: {
		fontSize: 16,
	},
	buttonText: {
		fontSize: 14,
		fontWeight: '500',
		flex: 1,
	},
});
