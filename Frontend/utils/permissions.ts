// Permission types that match the backend enum
export enum PermissionType {
	// Server-wide permissions
	MANAGE_SERVER = 'MANAGE_SERVER',
	KICK_MEMBERS = 'KICK_MEMBERS',
	BAN_MEMBERS = 'BAN_MEMBERS',
	MANAGE_ROLES = 'MANAGE_ROLES',
	INVITE_LINKS = 'INVITE_LINKS',
	CREATE_INVITE = 'CREATE_INVITE',
	SERVER_MEMBER = 'SERVER_MEMBER',

	// Channel permissions
	VIEW_CHANNEL = 'VIEW_CHANNEL',
	SEND_MESSAGES = 'SEND_MESSAGES',
	MANAGE_MESSAGES = 'MANAGE_MESSAGES',
	CONNECT = 'CONNECT',
	SPEAK = 'SPEAK',
	MUTE_MEMBERS = 'MUTE_MEMBERS',
	DEAFEN_MEMBERS = 'DEAFEN_MEMBERS',
}

export interface Permission {
	type: PermissionType;
	name: string;
	description: string;
}

// Permission categories with localization
// Note: ALL permissions can be set at server level (server-wide defaults)
// Channel permissions can override server-wide settings for specific channels
export const createPermissionCategories = (Resources: any): { [key: string]: Permission[] } => ({
	serverManagement: [
		{
			type: PermissionType.MANAGE_SERVER,
			name: Resources.Permissions.MANAGE_SERVER.Name,
			description: Resources.Permissions.MANAGE_SERVER.Description,
		},
		{
			type: PermissionType.KICK_MEMBERS,
			name: Resources.Permissions.KICK_MEMBERS.Name,
			description: Resources.Permissions.KICK_MEMBERS.Description,
		},
		{
			type: PermissionType.BAN_MEMBERS,
			name: Resources.Permissions.BAN_MEMBERS.Name,
			description: Resources.Permissions.BAN_MEMBERS.Description,
		},
		{
			type: PermissionType.MANAGE_ROLES,
			name: Resources.Permissions.MANAGE_ROLES.Name,
			description: Resources.Permissions.MANAGE_ROLES.Description,
		},
		{
			type: PermissionType.CREATE_INVITE,
			name: Resources.Permissions.CREATE_INVITE.Name,
			description: Resources.Permissions.CREATE_INVITE.Description,
		},
		{
			type: PermissionType.INVITE_LINKS,
			name: Resources.Permissions.INVITE_LINKS?.Name || 'Invite Links',
			description: Resources.Permissions.INVITE_LINKS?.Description || 'Manage invite links',
		},
		{
			type: PermissionType.SERVER_MEMBER,
			name: Resources.Permissions.SERVER_MEMBER?.Name || 'Server Member',
			description: Resources.Permissions.SERVER_MEMBER?.Description || 'Basic server membership',
		},
	],
	textChannels: [
		{
			type: PermissionType.VIEW_CHANNEL,
			name: Resources.Permissions.VIEW_CHANNEL.Name,
			description: Resources.Permissions.VIEW_CHANNEL.Description,
		},
		{
			type: PermissionType.SEND_MESSAGES,
			name: Resources.Permissions.SEND_MESSAGES.Name,
			description: Resources.Permissions.SEND_MESSAGES.Description,
		},
		{
			type: PermissionType.MANAGE_MESSAGES,
			name: Resources.Permissions.MANAGE_MESSAGES.Name,
			description: Resources.Permissions.MANAGE_MESSAGES.Description,
		},
	],
	voiceChannels: [
		{
			type: PermissionType.VIEW_CHANNEL,
			name: Resources.Permissions.VIEW_CHANNEL.Name,
			description: Resources.Permissions.VIEW_CHANNEL.Description,
		},
		{
			type: PermissionType.CONNECT,
			name: Resources.Permissions.CONNECT.Name,
			description: Resources.Permissions.CONNECT.Description,
		},
		{
			type: PermissionType.SPEAK,
			name: Resources.Permissions.SPEAK.Name,
			description: Resources.Permissions.SPEAK.Description,
		},
		{
			type: PermissionType.MUTE_MEMBERS,
			name: Resources.Permissions.MUTE_MEMBERS.Name,
			description: Resources.Permissions.MUTE_MEMBERS.Description,
		},
		{
			type: PermissionType.DEAFEN_MEMBERS,
			name: Resources.Permissions.DEAFEN_MEMBERS.Name,
			description: Resources.Permissions.DEAFEN_MEMBERS.Description,
		},
	],
});

// Helper function to get all permissions as a flat array
export const getAllPermissions = (Resources: any): Permission[] => {
	const categories = createPermissionCategories(Resources);
	return Object.values(categories).flat();
};

// Helper function to get only channel-specific permissions (excluding server management)
export const getChannelPermissions = (Resources: any): Permission[] => {
	const categories = createPermissionCategories(Resources);
	return [...categories.textChannels, ...categories.voiceChannels];
};

// Helper function to get only text channel permissions
export const getTextChannelPermissions = (Resources: any): Permission[] => {
	const categories = createPermissionCategories(Resources);
	return categories.textChannels;
};

// Helper function to get only voice channel permissions
export const getVoiceChannelPermissions = (Resources: any): Permission[] => {
	const categories = createPermissionCategories(Resources);
	return categories.voiceChannels;
};

// Helper function to get channel permissions with channel-specific translations
export const getChannelSpecificTextPermissions = (Resources: any): Permission[] => {
	return [
		{
			type: PermissionType.VIEW_CHANNEL,
			name: Resources.ChannelPermissions.VIEW_CHANNEL.Name,
			description: Resources.ChannelPermissions.VIEW_CHANNEL.Description,
		},
		{
			type: PermissionType.SEND_MESSAGES,
			name: Resources.ChannelPermissions.SEND_MESSAGES.Name,
			description: Resources.ChannelPermissions.SEND_MESSAGES.Description,
		},
		{
			type: PermissionType.MANAGE_MESSAGES,
			name: Resources.ChannelPermissions.MANAGE_MESSAGES.Name,
			description: Resources.ChannelPermissions.MANAGE_MESSAGES.Description,
		},
	];
};

// Helper function to get voice channel permissions with channel-specific translations
export const getChannelSpecificVoicePermissions = (Resources: any): Permission[] => {
	return [
		{
			type: PermissionType.VIEW_CHANNEL,
			name: Resources.ChannelPermissions.VIEW_CHANNEL.Name,
			description: Resources.ChannelPermissions.VIEW_CHANNEL.Description,
		},
		{
			type: PermissionType.CONNECT,
			name: Resources.ChannelPermissions.CONNECT.Name,
			description: Resources.ChannelPermissions.CONNECT.Description,
		},
		{
			type: PermissionType.SPEAK,
			name: Resources.ChannelPermissions.SPEAK.Name,
			description: Resources.ChannelPermissions.SPEAK.Description,
		},
		{
			type: PermissionType.MUTE_MEMBERS,
			name: Resources.ChannelPermissions.MUTE_MEMBERS.Name,
			description: Resources.ChannelPermissions.MUTE_MEMBERS.Description,
		},
		{
			type: PermissionType.DEAFEN_MEMBERS,
			name: Resources.ChannelPermissions.DEAFEN_MEMBERS.Name,
			description: Resources.ChannelPermissions.DEAFEN_MEMBERS.Description,
		},
	];
};
