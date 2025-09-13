export interface ButtonProps {
	title?: string;
	onPress: () => void;
	variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'circular';
	size?: 'small' | 'medium' | 'large';
	disabled?: boolean;
	style?: any;
	textStyle?: any;
	activeOpacity?: number;
	icon?: React.ReactNode;
	isCircular?: boolean;
}

export interface WelcomeScreenProps {
	onCreateServer: () => void;
	onJoinServer: () => void;
	onCreateDirectChannel: () => void;
}

export interface SidebarActionsProps {
	onAddServer?: () => void;
	onCreateDirectMessage?: () => void;
}

export interface ServerItemProps {
	server: import('@/types/sidebar').Server;
	isSelected: boolean;
	onPress: (server: import('@/types/sidebar').Server) => void;
}

export interface DirectChannelItemProps {
	channel: import('@/types/sidebar').DirectChannel;
	isSelected: boolean;
	onPress: (channelId: string) => void;
}

export interface JoinServerModalProps {
	visible: boolean;
	onClose: () => void;
	onJoin?: (inviteLink: string) => void;
	onJoinServer?: (server: any) => void;
	colors?: any;
}

export interface ServerManagementProps {
	serverId: string;
	serverName: string;
	canManageServer: boolean;
	onManageRoles?: () => void;
	onCreateInvite?: () => void;
	onServerSettings?: () => void;
}