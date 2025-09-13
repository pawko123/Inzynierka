import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Modal,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { getStrings } from '@/i18n';
import { api } from '@/services/api';
import { translateError } from '@/utils/errorTranslator';
import { Permission, getChannelSpecificTextPermissions, getChannelSpecificVoicePermissions } from '@/utils/permissions';
import PermissionItem from './PermissionItem';

interface Role {
	id: string;
	name: string;
	color: string;
	isDefault: boolean;
}

interface RolePermissions {
	[key: string]: boolean;
}

interface ChannelPermissions {
	[channelId: string]: { [permission: string]: boolean };
}

interface Channel {
	id: string;
	name: string;
	type: string;
}

interface RoleData {
	id: string;
	name: string;
	color: string;
	isDefault: boolean;
	serverId: string;
	rolePermissions: string[]; // Server-wide permissions
	channelPermissions: {
		channelId: string;
		permissions: string[];
	}[];
	currentHolders: {
		id: string;
		userId: string;
		memberName: string;
	}[];
}

interface RoleDetailsModalProps {
	role: Role;
	serverId: string;
	permissionCategories: { [key: string]: Permission[] };
	onClose: () => void;
	onRoleUpdated: () => Promise<void>;
}

export default function RoleDetailsModal({
	role,
	serverId,
	permissionCategories,
	onClose,
	onRoleUpdated,
}: RoleDetailsModalProps) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];
	const Resources = getStrings();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [permissions, setPermissions] = useState<RolePermissions>({});
	const [roleData, setRoleData] = useState<RoleData | null>(null);
	const [channels, setChannels] = useState<Channel[]>([]);
	const [channelPermissions, setChannelPermissions] = useState<ChannelPermissions>({});
	const [activePermissionTab, setActivePermissionTab] = useState<'server' | 'channels'>('server');

	const fetchRolePermissions = useCallback(async () => {
		try {
			setLoading(true);
			
			// Fetch role data and server channels in parallel
			const [roleResponse, channelsResponse] = await Promise.all([
				api.get(`/role/getRole?roleId=${role.id}&serverId=${serverId}`),
				api.get(`/server/getChannels?serverId=${serverId}`)
			]);
			
			const roleData = roleResponse.data;
			const channelsData = channelsResponse.data;
			
			// Store full role data and channels
			setRoleData(roleData);
			setChannels(channelsData || []);
			
			// Convert server-wide permissions array to boolean map for UI
			const permissionMap: RolePermissions = {};
			if (roleData.rolePermissions && roleData.rolePermissions.length > 0) {
				roleData.rolePermissions.forEach((perm: string) => {
					permissionMap[perm] = true;
				});
			}
			console.log('Setting permissions:', permissionMap);
			setPermissions(permissionMap);
			
			// Convert channel permissions to nested boolean map
			const channelPermMap: ChannelPermissions = {};
			if (roleData.channelPermissions && roleData.channelPermissions.length > 0) {
				roleData.channelPermissions.forEach((channelPerm: any) => {
					if (!channelPermMap[channelPerm.channelId]) {
						channelPermMap[channelPerm.channelId] = {};
					}
					channelPerm.permissions.forEach((perm: string) => {
						channelPermMap[channelPerm.channelId][perm] = true;
					});
				});
			}
			console.log('Setting channel permissions:', channelPermMap);
			setChannelPermissions(channelPermMap);
			
		} catch (err: any) {
			console.error('Error fetching role permissions:', err);
			const errorMessage = translateError(err.response?.data?.error || 'Failed to load role permissions');
			Alert.alert('Error', errorMessage);
		} finally {
			setLoading(false);
		}
	}, [role.id, serverId]);

	useEffect(() => {
		fetchRolePermissions();
	}, [fetchRolePermissions]);

	const handlePermissionToggle = (permissionType: string) => {
		setPermissions(prev => ({
			...prev,
			[permissionType]: !prev[permissionType],
		}));
	};

	const handleChannelPermissionToggle = (channelId: string, permissionType: string) => {
		setChannelPermissions(prev => ({
			...prev,
			[channelId]: {
				...prev[channelId],
				[permissionType]: !prev[channelId]?.[permissionType],
			},
		}));
	};

	const handleSavePermissions = async () => {
		try {
			setSaving(true);
			
			// Convert permissions map to array of permission types
			const permissionTypes = Object.keys(permissions).filter(key => permissions[key]);
			
			// Save server-wide permissions
			await api.put('/role/updatePermissions', {
				roleId: role.id,
				serverId: serverId,
				permissions: permissionTypes,
			});

			// Save channel-specific permissions
			const channelPermissionsArray = Object.entries(channelPermissions)
				.map(([channelId, perms]) => ({
					channelId,
					permissions: Object.keys(perms).filter(key => perms[key]),
				}));

			// Always send channel permissions update (even if empty) to clear removed permissions
			await api.put('/role/updateChannelPermissions', {
				serverId: serverId,
				roleId: role.id,
				channelPermissions: channelPermissionsArray,
			});
			
			Alert.alert(Resources.ServerManagement.Success, Resources.ServerManagement.Role_Updated);
			await onRoleUpdated();
			onClose();
		} catch (err: any) {
			console.error('Error updating role permissions:', err);
			const errorMessage = translateError(err.response?.data?.error || Resources.ServerManagement.Errors.Update_Role_Failed);
			Alert.alert(Resources.ServerManagement.Error, errorMessage);
		} finally {
			setSaving(false);
		}
	};

	const renderPermissionSection = (categoryName: string, categoryPermissions: Permission[]) => {
		return categoryPermissions.map((permission) => (
			<PermissionItem
				key={permission.type}
				permission={permission}
				value={permissions[permission.type] || false}
				onValueChange={() => handlePermissionToggle(permission.type)}
				disabled={saving}
			/>
		));
	};

	const renderChannelPermissionSection = (channel: Channel) => {
		// Use appropriate permissions based on channel type with channel-specific translations
		const availableChannelPermissions = channel.type === 'voice' 
			? getChannelSpecificVoicePermissions(Resources)
			: getChannelSpecificTextPermissions(Resources);
		
		return (
			<View key={channel.id} style={styles.section}>
				<View style={styles.channelHeader}>
					<Text style={[styles.channelIcon, { color: colors.text }]}>
						{channel.type === 'voice' ? '🔊' : '#'}
					</Text>
					<Text style={[styles.channelTitle, { color: colors.text }]}>
						{channel.name}
					</Text>
				</View>
				<Text style={[styles.sectionDescription, { color: colors.tabIconDefault }]}>
					{Resources.ServerManagement.Override_Server_Permissions}
				</Text>
				{availableChannelPermissions.map((permission: Permission) => (
					<PermissionItem
						key={permission.type}
						permission={permission}
						value={channelPermissions[channel.id]?.[permission.type] || false}
						onValueChange={() => handleChannelPermissionToggle(channel.id, permission.type)}
						disabled={saving}
					/>
				))}
			</View>
		);
	};

	return (
		<Modal
			visible={true}
			transparent
			animationType="slide"
			onRequestClose={onClose}
		>
			<View style={styles.overlay}>
				<View style={[styles.modal, { backgroundColor: colors.card }]}>
					<View style={[styles.header, { borderBottomColor: colors.border }]}>
						<View style={styles.roleInfo}>
							<View style={[styles.roleColorIndicator, { backgroundColor: role.color }]} />
							<Text style={[styles.title, { color: colors.text }]}>
								{role.name} {Resources.ServerManagement.Permissions}
							</Text>
						</View>
						<TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={saving}>
							<Text style={[styles.closeButtonText, { color: colors.text }]}>×</Text>
						</TouchableOpacity>
					</View>

					{loading ? (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="large" color={colors.tint} />
							<Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>
								Loading permissions...
							</Text>
						</View>
					) : (
						<>
							{/* Permission Tabs */}
							<View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
								<TouchableOpacity
									style={[
										styles.tab,
										activePermissionTab === 'server' && { borderBottomColor: colors.tint },
									]}
									onPress={() => setActivePermissionTab('server')}
								>
									<Text style={[
										styles.tabText,
										{ color: activePermissionTab === 'server' ? colors.tint : colors.tabIconDefault }
									]}>
										{Resources.ServerManagement.Server_Permissions_Tab}
									</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[
										styles.tab,
										activePermissionTab === 'channels' && { borderBottomColor: colors.tint },
									]}
									onPress={() => setActivePermissionTab('channels')}
								>
									<Text style={[
										styles.tabText,
										{ color: activePermissionTab === 'channels' ? colors.tint : colors.tabIconDefault }
									]}>
										{Resources.ServerManagement.Channel_Permissions_Tab}
									</Text>
								</TouchableOpacity>
							</View>

							<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
								{activePermissionTab === 'server' ? (
									<>
										{/* Server-wide permissions */}
										<View style={styles.section}>
											{Object.entries(permissionCategories).map(([categoryName, categoryPermissions]) =>
												renderPermissionSection(categoryName, categoryPermissions)
											)}
										</View>
										
										{/* Current Role Holders Section */}
										{roleData && roleData.currentHolders && roleData.currentHolders.length > 0 && (
											<View style={[styles.section, styles.additionalSection, { borderTopColor: colors.border }]}>
												<Text style={[styles.sectionTitle, { color: colors.text }]}>
													Current Members ({roleData.currentHolders.length})
												</Text>
												{roleData.currentHolders.map((holder) => (
													<View key={holder.id} style={[styles.memberItem, { borderBottomColor: colors.border }]}>
														<Text style={[styles.memberName, { color: colors.text }]}>
															{holder.memberName}
														</Text>
													</View>
												))}
											</View>
										)}
									</>
								) : (
									<>
										{/* Channel-specific permissions */}
										{channels.map((channel) => renderChannelPermissionSection(channel))}
									</>
								)}
							</ScrollView>
						</>
					)}

					<View style={[styles.footer, { borderTopColor: colors.border }]}>
						<TouchableOpacity
							style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
							onPress={onClose}
							disabled={saving}
						>
							<Text style={[styles.buttonText, { color: colors.text }]}>
								{Resources.ServerManagement.Cancel}
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[
								styles.button,
								styles.saveButton,
								{ backgroundColor: colors.tint },
								saving && styles.disabledButton,
							]}
							onPress={handleSavePermissions}
							disabled={saving}
						>
							<Text style={[styles.buttonText, { color: colors.background }]}>
								{saving ? Resources.ServerManagement.Saving : Resources.ServerManagement.Save_Changes}
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	modal: {
		width: '100%',
		maxWidth: 500,
		maxHeight: '90%',
		borderRadius: 12,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		borderBottomWidth: 1,
	},
	roleInfo: {
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
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 40,
		gap: 12,
	},
	loadingText: {
		fontSize: 14,
	},
	content: {
		flex: 1,
		padding: 16,
	},
	section: {
		marginBottom: 24,
	},
	additionalSection: {
		borderTopWidth: 1,
		paddingTop: 16,
		marginTop: 8,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 12,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	channelHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	channelIcon: {
		fontSize: 16,
		marginRight: 8,
		minWidth: 20,
		textAlign: 'center',
	},
	channelTitle: {
		fontSize: 16,
		fontWeight: '600',
		flex: 1,
	},
	footer: {
		flexDirection: 'row',
		padding: 16,
		gap: 12,
		borderTopWidth: 1,
	},
	button: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: 'center',
	},
	cancelButton: {
		borderWidth: 1,
	},
	saveButton: {
		// backgroundColor set dynamically
	},
	disabledButton: {
		opacity: 0.6,
	},
	buttonText: {
		fontSize: 14,
		fontWeight: '600',
	},
	sectionDescription: {
		fontSize: 12,
		lineHeight: 16,
		marginBottom: 12,
		fontStyle: 'italic',
	},
	memberItem: {
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(0,0,0,0.1)',
	},
	memberName: {
		fontSize: 14,
		fontWeight: '500',
	},
	channelPermItem: {
		paddingVertical: 8,
		paddingHorizontal: 12,
		marginBottom: 8,
		borderRadius: 6,
		backgroundColor: 'rgba(0,0,0,0.05)',
	},
	channelName: {
		fontSize: 14,
		fontWeight: '500',
		marginBottom: 4,
	},
	channelPerms: {
		fontSize: 12,
		lineHeight: 16,
	},
	tabContainer: {
		flexDirection: 'row',
		borderBottomWidth: 1,
	},
	tab: {
		flex: 1,
		paddingVertical: 12,
		paddingHorizontal: 16,
		alignItems: 'center',
		borderBottomWidth: 2,
		borderBottomColor: 'transparent',
	},
	tabText: {
		fontSize: 14,
		fontWeight: '600',
	},
});
