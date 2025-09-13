import React from 'react';
import ImageAttachment from './ImageAttachment';
import VideoAttachment from './VideoAttachment';
import FileAttachment from './FileAttachment';

interface MessageAttachmentData {
	id: string;
	fileName: string;
	url: string;
	fileType: string;
	size: number;
}

interface MessageAttachmentProps {
	attachment: MessageAttachmentData;
	serverId: string;
	channelId: string;
	colors: any;
}

export default function MessageAttachment({ 
	attachment, 
	serverId, 
	channelId, 
	colors 
}: MessageAttachmentProps) {
	const isImage = attachment.fileType.startsWith('image/');
	const isVideo = attachment.fileType.startsWith('video/');

	console.log('MessageAttachment:', {
		fileName: attachment.fileName,
		fileType: attachment.fileType,
		isImage,
		isVideo
	});

	if (isImage) {
		console.log('Rendering ImageAttachment for:', attachment.fileName);
		return (
			<ImageAttachment
				attachment={attachment}
				serverId={serverId}
				channelId={channelId}
				colors={colors}
			/>
		);
	}

	if (isVideo) {
		console.log('Rendering VideoAttachment for:', attachment.fileName);
		return (
			<VideoAttachment
				attachment={attachment}
				serverId={serverId}
				channelId={channelId}
				colors={colors}
			/>
		);
	}

	console.log('Rendering FileAttachment for:', attachment.fileName);
	// For all other file types (including audio), show file attachment
	return (
		<FileAttachment
			attachment={attachment}
			serverId={serverId}
			channelId={channelId}
			colors={colors}
		/>
	);
}
