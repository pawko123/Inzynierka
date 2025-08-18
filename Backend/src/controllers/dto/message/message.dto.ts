import { MemberDto } from '../member/member.dto';

export class MessageDTO {
	messageId: string;
	content: string;
	channelId: string;
	sender: MemberDto;
	attachments: MessageAttachmentDTO[];
	createdAt: Date;
}

class MessageAttachmentDTO {
	id: string;
	fileName: string;
	url: string;
	fileType: string;
	size: number;
}
