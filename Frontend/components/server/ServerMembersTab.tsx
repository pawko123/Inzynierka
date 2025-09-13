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

interface ServerMember {
	id: string;
	memberName: string;
	user: {
		id: string;
		username: string;
	};
	roles: Role[];
}

interface ServerMembersTabProps {
	members: ServerMember[];
	onMemberSelect: (member: ServerMember) => void;
}

export default function ServerMembersTab({ 
	members, 
	onMemberSelect 
}: ServerMembersTabProps) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];
	const Resources = getStrings();

	const renderMemberItem = ({ item }: { item: ServerMember }) => (
		<View style={[styles.memberItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
			<View style={styles.memberInfo}>
				<Text style={[styles.memberName, { color: colors.text }]}>{item.memberName}</Text>
				<Text style={[styles.memberUsername, { color: colors.tabIconDefault }]}>@{item.user.username}</Text>
			</View>
			<View style={styles.memberRoles}>
				{item.roles.map((role) => (
					<View
						key={role.id}
						style={[styles.memberRoleTag, { backgroundColor: role.color + '20', borderColor: role.color }]}
					>
						<Text style={[styles.memberRoleText, { color: role.color }]}>{role.name}</Text>
					</View>
				))}
			</View>
			<TouchableOpacity
				style={[styles.manageRolesButton, { borderColor: colors.tint }]}
				onPress={() => onMemberSelect(item)}
			>
				<Text style={[styles.manageRolesButtonText, { color: colors.tint }]}>
					{Resources.ServerManagement.Manage_Roles_Button}
				</Text>
			</TouchableOpacity>
		</View>
	);

	return (
		<View style={styles.tabContent}>
			<View style={styles.sectionHeader}>
				<Text style={[styles.sectionTitle, { color: colors.text }]}>
					Server Members ({members.length})
				</Text>
			</View>
			<FlatList
				data={members}
				renderItem={renderMemberItem}
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
	listContainer: {
		gap: 8,
	},
	memberItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
	},
	memberInfo: {
		flex: 1,
	},
	memberName: {
		fontSize: 14,
		fontWeight: '500',
	},
	memberUsername: {
		fontSize: 12,
		marginTop: 2,
	},
	memberRoles: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 4,
	},
	memberRoleTag: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 4,
		borderWidth: 1,
	},
	memberRoleText: {
		fontSize: 10,
		fontWeight: '500',
	},
	manageRolesButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 4,
		borderWidth: 1,
	},
	manageRolesButtonText: {
		fontSize: 12,
		fontWeight: '500',
	},
});
