export interface Channel {
	id: string;
	name: string;
	type: 'text' | 'voice' | string; // Allow both strict typing and string for flexibility
	serverId?: string;
	createdAt?: string;
}

export interface MessageAttachment {
	id: string;
	fileName: string;
	url: string;
	fileType: string;
	size: number;
}

export interface ChannelChatProps {
	channel: Channel;
	serverId?: string;
}

export interface ServerContentProps {
	serverId: string;
	serverName?: string;
	onChannelSelect?: (channelId: string) => void;
	server?: {
		id: string;
		name: string;
		logo?: string;
	};
	selectedChannel?: Channel | null;
}

export interface ServerSidebarProps {
	server: {
		id: string;
		name: string;
		logo?: string;
	};
	onChannelSelect: (channel: Channel) => void;
	selectedChannel: Channel | null;
}

export interface ServerActionButtonsProps {
	serverId: string;
	hasManagePermission?: boolean;
	canCreateChannel?: boolean;
	canManageRoles?: boolean;
	canCreateInvite?: boolean;
	onCreateChannel?: (channelData: { name: string; type: 'text' | 'voice' }) => void;
	onManageRoles?: () => void;
}

export interface ChannelSectionProps {
	title: string;
	channels: Channel[];
	canManageServer: boolean;
	onChannelPress: (channel: Channel) => void;
	onAddChannel: () => void;
}

export interface ChannelSidebarProps {
	serverId: string;
	serverName?: string;
	channels: Channel[];
	loading: boolean;
	error: string | null;
	canManageServer: boolean;
	canManageRoles: boolean;
	canCreateInvite: boolean;
	onChannelPress: (channel: Channel) => void;
	onAddChannel: () => void;
	onManageRoles: () => void;
	onRetry: () => void;
}

export interface MainServerSidebarProps {
	onServerSelect?: (server: import('@/types/sidebar').Server) => void;
	onDirectChannelSelect?: (channel: import('@/types/sidebar').DirectChannel) => void;
	onAddServer?: () => void;
	onCreateDirectMessage?: () => void;
}