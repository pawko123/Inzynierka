import React from 'react';
import { MessageAttachmentProps } from '@/types/message';
import ImageAttachment from './ImageAttachment';
import VideoAttachment from './VideoAttachment';
import AudioAttachment from './AudioAttachment';
import FileAttachment from './FileAttachment';

export default function MessageAttachment({ 
	attachment, 
	serverId, 
	channelId, 
	colors 
}: MessageAttachmentProps) {
	const isImage = attachment.fileType.startsWith('image/');
	const isVideo = attachment.fileType.startsWith('video/');
	const isAudio = attachment.fileType.startsWith('audio/');

	console.log('MessageAttachment:', {
		fileName: attachment.fileName,
		fileType: attachment.fileType,
		isImage,
		isVideo,
		isAudio
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

	if (isAudio) {
		console.log('Rendering AudioAttachment for:', attachment.fileName);
		return (
			<AudioAttachment
				attachment={attachment}
				serverId={serverId}
				channelId={channelId}
				colors={colors}
			/>
		);
	}

	console.log('Rendering FileAttachment for:', attachment.fileName);
	// For all other file types, show file attachment
	return (
		<FileAttachment
			attachment={attachment}
			serverId={serverId}
			channelId={channelId}
			colors={colors}
		/>
	);
}
