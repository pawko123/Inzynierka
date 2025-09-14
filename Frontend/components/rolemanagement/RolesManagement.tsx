import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { getStrings } from '@/i18n';
import { api } from '@/services/api';
import { translateError } from '@/utils/errorTranslator';
import CreateRoleModal from './CreateRoleModal';
import RoleDetailsModal from './RoleDetailsModal';
import MemberRoleModal from './MemberRoleModal';
import ServerRolesTab from '../server/ServerRolesTab';
import ServerMembersTab from '../server/ServerMembersTab';
import { createPermissionCategories } from '@/utils/permissions';
import { Role, ServerMember, RolesManagementProps } from '@/types/roles';

export default function RolesManagement({ serverId, serverName, onClose }: RolesManagementProps) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];
	const Resources = getStrings();

	const [roles, setRoles] = useState<Role[]>([]);
	const [members, setMembers] = useState<ServerMember[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedTab, setSelectedTab] = useState<'roles' | 'members'>('roles');
	const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
	const [selectedRole, setSelectedRole] = useState<Role | null>(null);
	const [selectedMember, setSelectedMember] = useState<ServerMember | null>(null);
	const [showMemberRoleModal, setShowMemberRoleModal] = useState(false);
	const [assigningRoles, setAssigningRoles] = useState<Set<string>>(new Set());
	const [removingRoles, setRemovingRoles] = useState<Set<string>>(new Set());

	// Permission categories for UI organization
	const permissionCategories = useMemo(() => createPermissionCategories(Resources), [Resources]);

	const fetchServerData = useCallback(async () => {
		try {
			setLoading(true);

			// Fetch server with roles
			const serverResponse = await api.get(`/server/getServer?serverId=${serverId}`);
			setRoles(serverResponse.data.roles || []);

			// Fetch server members
			const membersResponse = await api.get(`/server/getMembers?serverId=${serverId}`);
			setMembers(membersResponse.data || []);
		} catch (err: any) {
			console.error('Error fetching server data:', err);
			const errorMessage = translateError(
				err.response?.data?.error || 'Failed to load server data',
			);
			Alert.alert('Error', errorMessage);
		} finally {
			setLoading(false);
		}
	}, [serverId]);

	useEffect(() => {
		fetchServerData();
	}, [fetchServerData]);

	const handleCreateRole = async (roleName: string, roleColor: string) => {
		try {
			await api.post('/role/create', {
				serverId,
				name: roleName,
				color: roleColor,
			});

			// Refresh roles
			await fetchServerData();
			setShowCreateRoleModal(false);

			Alert.alert('Success', 'Role created successfully');
		} catch (err: any) {
			console.error('Error creating role:', err);
			const errorMessage = translateError(
				err.response?.data?.error || 'Failed to create role',
			);
			Alert.alert('Error', errorMessage);
		}
	};

	const handleAssignRole = async (memberId: string, roleId: string) => {
		const loadingKey = `${memberId}-${roleId}`;
		setAssigningRoles((prev) => new Set(prev).add(loadingKey));

		try {
			await api.post('/role/assignRole', {
				serverId,
				memberId,
				roleId,
			});

			// Only update UI after successful API response
			const roleToAssign = roles.find((r) => r.id === roleId);
			if (roleToAssign && selectedMember) {
				// Update selected member in modal
				setSelectedMember((prev) => {
					if (!prev) return prev;
					return {
						...prev,
						roles: [...(prev.roles || []), roleToAssign],
					};
				});

				// Update members list
				setMembers((prev) =>
					prev.map((member) =>
						member.id === memberId
							? { ...member, roles: [...(member.roles || []), roleToAssign] }
							: member,
					),
				);
			}

			Alert.alert(
				Resources.ServerManagement.Success,
				Resources.ServerManagement.Role_Assigned_Success,
			);
		} catch (err: any) {
			console.error('Error assigning role:', err);
			const errorMessage = translateError(
				err.response?.data?.error || 'Failed to assign role',
			);
			Alert.alert(Resources.ServerManagement.Error, errorMessage);
		} finally {
			setAssigningRoles((prev) => {
				const newSet = new Set(prev);
				newSet.delete(loadingKey);
				return newSet;
			});
		}
	};

	const handleRemoveRole = async (memberId: string, roleId: string) => {
		const loadingKey = `${memberId}-${roleId}`;
		setRemovingRoles((prev) => new Set(prev).add(loadingKey));

		try {
			await api.post('/role/removeRole', {
				serverId,
				memberId,
				roleId,
			});

			// Only update UI after successful API response
			if (selectedMember) {
				// Update selected member in modal
				setSelectedMember((prev) => {
					if (!prev) return prev;
					return {
						...prev,
						roles: prev.roles?.filter((r) => r.id !== roleId) || [],
					};
				});

				// Update members list
				setMembers((prev) =>
					prev.map((member) =>
						member.id === memberId
							? {
									...member,
									roles: member.roles?.filter((r) => r.id !== roleId) || [],
								}
							: member,
					),
				);
			}

			Alert.alert(
				Resources.ServerManagement.Success,
				Resources.ServerManagement.Role_Removed_Success,
			);
		} catch (err: any) {
			console.error('Error removing role:', err);
			const errorMessage = translateError(
				err.response?.data?.error || 'Failed to remove role',
			);
			Alert.alert(Resources.ServerManagement.Error, errorMessage);
		} finally {
			setRemovingRoles((prev) => {
				const newSet = new Set(prev);
				newSet.delete(loadingKey);
				return newSet;
			});
		}
	};

	const handleDeleteRole = async (roleId: string) => {
		Alert.alert(
			Resources.ServerManagement.Delete_Role,
			Resources.ServerManagement.Confirm_Delete,
			[
				{ text: Resources.ServerManagement.Cancel, style: 'cancel' },
				{
					text: Resources.ServerManagement.Delete,
					style: 'destructive',
					onPress: async () => {
						try {
							await api.delete(`/role/delete?roleId=${roleId}`);

							// Refresh roles
							await fetchServerData();

							Alert.alert(
								Resources.ServerManagement.Success,
								Resources.ServerManagement.Role_Deleted,
							);
						} catch (err: any) {
							console.error('Error deleting role:', err);
							const errorMessage = translateError(
								err.response?.data?.error || 'Failed to delete role',
							);
							Alert.alert(Resources.ServerManagement.Error, errorMessage);
						}
					},
				},
			],
		);
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<View style={[styles.header, { borderBottomColor: colors.border }]}>
				<Text style={[styles.title, { color: colors.text }]}>
					{Resources.ServerManagement.Manage_Roles} - {serverName}
				</Text>
				{onClose && (
					<TouchableOpacity onPress={onClose} style={styles.closeButton}>
						<Text style={[styles.closeButtonText, { color: colors.text }]}>×</Text>
					</TouchableOpacity>
				)}
			</View>

			{/* Tab Navigation */}
			<View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
				<TouchableOpacity
					style={[
						styles.tab,
						selectedTab === 'roles' && { backgroundColor: colors.tint },
					]}
					onPress={() => setSelectedTab('roles')}
				>
					<Text
						style={[
							styles.tabText,
							selectedTab === 'roles'
								? {
										color: colorScheme === 'dark' ? '#000000' : '#FFFFFF',
										fontWeight: '600',
									}
								: { color: colors.text },
						]}
					>
						{Resources.ServerManagement.Roles}
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[
						styles.tab,
						selectedTab === 'members' && { backgroundColor: colors.tint },
					]}
					onPress={() => setSelectedTab('members')}
				>
					<Text
						style={[
							styles.tabText,
							selectedTab === 'members'
								? {
										color: colorScheme === 'dark' ? '#000000' : '#FFFFFF',
										fontWeight: '600',
									}
								: { color: colors.text },
						]}
					>
						{Resources.ServerManagement.Members}
					</Text>
				</TouchableOpacity>
			</View>

			{loading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={colors.tint} />
					<Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>
						Loading server data...
					</Text>
				</View>
			) : (
				<View style={styles.content}>
					{selectedTab === 'roles' ? (
						<ServerRolesTab
							roles={roles}
							onCreateRole={() => setShowCreateRoleModal(true)}
							onRoleSelect={setSelectedRole}
							onDeleteRole={handleDeleteRole}
						/>
					) : (
						<ServerMembersTab
							members={members}
							roles={roles}
							onManageMemberRoles={(memberId) => {
								const member = members.find((m) => m.id === memberId);
								if (member) {
									setSelectedMember(member);
									setShowMemberRoleModal(true);
								}
							}}
							onMemberSelect={(member) => {
								setSelectedMember(member);
								setShowMemberRoleModal(true);
							}}
						/>
					)}
				</View>
			)}

			{/* Create Role Modal */}
			<CreateRoleModal
				visible={showCreateRoleModal}
				onClose={() => setShowCreateRoleModal(false)}
				onCreateRole={handleCreateRole}
			/>

			{/* Role Details Modal */}
			{selectedRole && (
				<RoleDetailsModal
					role={selectedRole}
					serverId={serverId}
					permissionCategories={permissionCategories}
					onClose={() => setSelectedRole(null)}
					onRoleUpdated={fetchServerData}
				/>
			)}

			{/* Member Role Management Modal */}
			<MemberRoleModal
				visible={showMemberRoleModal}
				member={selectedMember}
				roles={roles}
				assigningRoles={assigningRoles}
				removingRoles={removingRoles}
				onClose={() => {
					setShowMemberRoleModal(false);
					setSelectedMember(null);
				}}
				onAssignRole={handleAssignRole}
				onRemoveRole={handleRemoveRole}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
	},
	title: {
		fontSize: 18,
		fontWeight: '600',
		flex: 1,
	},
	closeButton: {
		padding: 4,
	},
	closeButtonText: {
		fontSize: 24,
		fontWeight: 'bold',
	},
	tabContainer: {
		flexDirection: 'row',
		padding: 6,
		marginHorizontal: 16,
		marginVertical: 12,
		borderRadius: 10,
	},
	tab: {
		flex: 1,
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 8,
		alignItems: 'center',
		marginHorizontal: 2,
	},
	tabText: {
		fontSize: 14,
		fontWeight: '500',
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
		paddingTop: 8,
		paddingBottom: 16,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		gap: 12,
	},
	loadingText: {
		fontSize: 14,
	},
	tabContent: {
		flex: 1,
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
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
		borderWidth: 1,
		marginLeft: 8,
	},
	manageRolesButtonText: {
		fontSize: 10,
		fontWeight: '500',
	},
});
