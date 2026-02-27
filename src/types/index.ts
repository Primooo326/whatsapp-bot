export interface SendMessageRequest {
    to: string[];
    message: string;
    multimedia?: string[];
    archivo?: string[];
    tags?: string[];
    envioMultimediaJunto?: boolean;
    replyMessageId?: string;
}

export interface SendGroupMessageRequest {
    groupId: string;
    message: string;
    multimedia?: string[];
    archivo?: string[];
    tags?: string[];
    envioMultimediaJunto?: boolean;
    replyMessageId?: string;
}

export interface GroupInfo {
    id: string;
    name: string;
    participants: string[];
    image?: string;
}

export interface ChatInfo {
    name: string;
    number: string;
    image?: string;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
}

export interface HealthResponse {
    status: 'ok' | 'error';
    whatsappReady: boolean;
    timestamp: string;
}

