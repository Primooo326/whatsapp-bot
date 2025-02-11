// Interface para respuestas API estandarizadas
export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

// Interface para mensajes de WhatsApp
export interface WhatsAppMessage {
	from: string;
	body: string;
	timestamp: Date;
	type: 'text' | 'image' | 'location' | 'document';
	mediaUrl?: string;
}
