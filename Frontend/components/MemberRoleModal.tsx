import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ActivityIndicator,
	Modal,
	ScrollView,
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

interface MemberRoleModalProps {
	visible: boolean;
	member: ServerMember | null;
	roles: Role[];
	assigningRoles: Set<string>;
	removingRoles: Set<string>;
	onClose: () => void;
	onAssignRole: (memberId: string, roleId: string) => void;
	onRemoveRole: (memberId: string, roleId: string) => void;
}

export default function MemberRoleModal({
	visible,
	member,
	roles,
	assigningRoles,
	removingRoles,
	onClose,
	onAssignRole,
	onRemoveRole,
}: MemberRoleModalProps) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];
	const Resources = getStrings();

	if (!member) return null;

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={() => {
				if (assigningRoles.size === 0 && removingRoles.size === 0) {
					onClose();
				}
			}}
		>
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				<View style={[styles.header, { borderBottomColor: colors.border }]}>
					<Text style={[styles.title, { color: colors.text }]}>
						{Resources.ServerManagement.Manage_Member_Roles} - {member.memberName}
					</Text>
					<View style={{ flexDirection: 'row', alignItems: 'center' }}>
						{(assigningRoles.size > 0 || removingRoles.size > 0) && (
							<ActivityIndicator 
								size="small" 
								color={colors.tint} 
								style={{ marginRight: 12 }}
							/>
						)}
						<TouchableOpacity
							onPress={onClose}
							style={[
								styles.closeButton,
								{ opacity: (assigningRoles.size > 0 || removingRoles.size > 0) ? 0.5 : 1 }
							]}
							disabled={assigningRoles.size > 0 || removingRoles.size > 0}
						>
							<Text style={[styles.closeButtonText, { color: colors.text }]}>×</Text>
						</TouchableOpacity>
					</View>
				</View>

				<ScrollView style={styles.content}>
					<View style={styles.sectionHeader}>
						<Text style={[styles.sectionTitle, { color: colors.text }]}>
							{Resources.ServerManagement.Current_Roles}
						</Text>
					</View>
					
					{member.roles && member.roles.length > 0 ? (
						<View style={styles.listContainer}>
							{member.roles.map((role) => (
								<View key={role.id} style={[
									styles.roleItem,
									{ 
										backgroundColor: colors.card,
										borderColor: colors.border
									}
								]}>
									<View style={styles.roleHeader}>
										<View style={[styles.roleColorIndicator, { backgroundColor: role.color || '#888888' }]} />
										<Text style={[styles.roleName, { color: colors.text }]}>
											{role.name}
										</Text>
									</View>
									<TouchableOpacity
										onPress={() => onRemoveRole(member.id, role.id)}
										style={[
											styles.deleteButton, 
											{ 
												backgroundColor: '#ff4444',
												opacity: removingRoles.has(`${member.id}-${role.id}`) ? 0.6 : 1
											}
										]}
										disabled={removingRoles.has(`${member.id}-${role.id}`)}
									>
										{removingRoles.has(`${member.id}-${role.id}`) ? (
											<ActivityIndicator size="small" color="white" />
										) : (
											<Text style={styles.deleteButtonText}>
												{Resources.ServerManagement.Remove}
											</Text>
										)}
									</TouchableOpacity>
								</View>
							))}
						</View>
					) : (
						<Text style={[styles.placeholder, { color: colors.text }]}>
							{Resources.ServerManagement.No_Roles_Assigned}
						</Text>
					)}

					<View style={[styles.sectionHeader, { marginTop: 24 }]}>
						<Text style={[styles.sectionTitle, { color: colors.text }]}>
							{Resources.ServerManagement.Available_Roles}
						</Text>
					</View>
					
					{roles.filter(role => 
						!member.roles?.some(memberRole => memberRole.id === role.id)
					).length > 0 ? (
						<View style={styles.listContainer}>
							{roles
								.filter(role => !member.roles?.some(memberRole => memberRole.id === role.id))
								.map((role) => (
								<View key={role.id} style={[
									styles.roleItem,
									{ 
										backgroundColor: colors.card,
										borderColor: colors.border
									}
								]}>
									<View style={styles.roleHeader}>
										<View style={[styles.roleColorIndicator, { backgroundColor: role.color || '#888888' }]} />
										<Text style={[styles.roleName, { color: colors.text }]}>
											{role.name}
										</Text>
									</View>
									<TouchableOpacity
										onPress={() => onAssignRole(member.id, role.id)}
										style={[
											styles.createButton, 
											{ 
												backgroundColor: colors.tint,
												opacity: assigningRoles.has(`${member.id}-${role.id}`) ? 0.6 : 1
											}
										]}
										disabled={assigningRoles.has(`${member.id}-${role.id}`)}
									>
										{assigningRoles.has(`${member.id}-${role.id}`) ? (
											<ActivityIndicator 
												size="small" 
												color={colorScheme === 'dark' ? '#000000' : '#FFFFFF'} 
											/>
										) : (
											<Text style={[
												styles.createButtonText,
												{ color: colorScheme === 'dark' ? '#000000' : '#FFFFFF' }
											]}>
												{Resources.ServerManagement.Assign}
											</Text>
										)}
									</TouchableOpacity>
								</View>
							))}
						</View>
					) : (
						<Text style={[styles.placeholder, { color: colors.text }]}>
							{Resources.ServerManagement.No_Available_Roles}
						</Text>
					)}
				</ScrollView>
			</View>
		</Modal>
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
		padding: 16,
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
	content: {
		flex: 1,
		padding: 16,
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
	roleItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
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
	placeholder: {
		fontSize: 14,
		lineHeight: 20,
	},
});
