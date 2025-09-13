import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	FlatList,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { getStrings } from '@/i18n';

interface Role {
	id: string;
	name: string;
	color: string;
	isDefault: boolean;
}

interface ServerRolesTabProps {
	roles: Role[];
	onCreateRole: () => void;
	onRoleSelect: (role: Role) => void;
	onDeleteRole: (roleId: string) => void;
}

export default function ServerRolesTab({ 
	roles, 
	onCreateRole, 
	onRoleSelect, 
	onDeleteRole 
}: ServerRolesTabProps) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];
	const Resources = getStrings();

	const renderRoleItem = ({ item }: { item: Role }) => (
		<TouchableOpacity
			style={[
				styles.roleItem, 
				{ backgroundColor: colors.card, borderColor: colors.border },
				item.isDefault && styles.disabledRoleItem
			]}
			onPress={() => !item.isDefault && onRoleSelect(item)}
			disabled={item.isDefault}
		>
			<View style={styles.roleHeader}>
				<View style={[styles.roleColorIndicator, { backgroundColor: item.color }]} />
				<Text style={[styles.roleName, { color: colors.text }]}>{item.name}</Text>
				{item.isDefault && (
					<Text style={[styles.defaultBadge, { color: colors.tabIconDefault }]}>
						({Resources.ServerManagement.Default_Role_Badge})
					</Text>
				)}
			</View>
			{!item.isDefault && (
				<TouchableOpacity
					style={[styles.deleteButton, { backgroundColor: colors.destructive }]}
					onPress={() => onDeleteRole(item.id)}
				>
					<Text style={styles.deleteButtonText}>{Resources.ServerManagement.Delete}</Text>
				</TouchableOpacity>
			)}
		</TouchableOpacity>
	);

	return (
		<View style={styles.tabContent}>
			<View style={styles.sectionHeader}>
				<Text style={[styles.sectionTitle, { color: colors.text }]}>
					Server Roles ({roles.length})
				</Text>
				<TouchableOpacity
					style={[styles.createButton, { backgroundColor: colors.tint }]}
					onPress={onCreateRole}
				>
					<Text style={[
						styles.createButtonText, 
						{ color: colorScheme === 'dark' ? '#000000' : '#FFFFFF' }
					]}>
						{Resources.ServerManagement.Create_Role}
					</Text>
				</TouchableOpacity>
			</View>
			<FlatList
				data={roles}
				renderItem={renderRoleItem}
				keyExtractor={(item) => item.id}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.listContainer}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	tabContent: {
		flex: 1,
	},
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
	},
	createButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 6,
	},
	createButtonText: {
		color: 'white',
		fontSize: 14,
		fontWeight: '500',
	},
	listContainer: {
		gap: 8,
	},
	roleItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
	},
	disabledRoleItem: {
		opacity: 0.6,
	},
	roleHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	roleColorIndicator: {
		width: 12,
		height: 12,
		borderRadius: 6,
		marginRight: 8,
	},
	roleName: {
		fontSize: 14,
		fontWeight: '500',
	},
	defaultBadge: {
		fontSize: 12,
		fontStyle: 'italic',
		marginLeft: 8,
	},
	deleteButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 4,
	},
	deleteButtonText: {
		color: 'white',
		fontSize: 12,
		fontWeight: '500',
	},
});
