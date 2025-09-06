import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Permission } from '@/utils/permissions';

interface PermissionItemProps {
	permission: Permission;
	value: boolean;
	onValueChange: () => void;
	disabled?: boolean;
}

export default function PermissionItem({
	permission,
	value,
	onValueChange,
	disabled = false,
}: PermissionItemProps) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];

	return (
		<View style={[styles.permissionItem, { borderBottomColor: colors.border }]}>
			<View style={styles.permissionInfo}>
				<Text style={[styles.permissionName, { color: colors.text }]}>
					{permission.name}
				</Text>
				<Text style={[styles.permissionDescription, { color: colors.tabIconDefault }]}>
					{permission.description}
				</Text>
			</View>
			<Switch
				value={value}
				onValueChange={onValueChange}
				disabled={disabled}
				trackColor={{ false: colors.border, true: colors.tint + '60' }}
				thumbColor={value ? colors.tint : colors.tabIconDefault}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	permissionItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 12,
		borderBottomWidth: 1,
	},
	permissionInfo: {
		flex: 1,
		marginRight: 12,
	},
	permissionName: {
		fontSize: 14,
		fontWeight: '500',
		marginBottom: 2,
	},
	permissionDescription: {
		fontSize: 12,
		lineHeight: 16,
	},
});
