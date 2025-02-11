// Interface para el estado de la conversación
export interface ConversationState {
	step: ConversationStep;
	data: any;
	lastUpdate: Date;
}

// Enum para los pasos de la conversación
export enum ConversationStep {
	INICIO = 'INICIO',
	REGISTRO = 'REGISTRO',
	MENU_PRINCIPAL = 'MENU_PRINCIPAL',
	VER_MENU = 'VER_MENU',
	HACER_PEDIDO = 'HACER_PEDIDO',
	CONFIRMAR_PEDIDO = 'CONFIRMAR_PEDIDO',
	CONSULTAR_ESTADO = 'CONSULTAR_ESTADO',
	CONTACTO = 'CONTACTO'
}

// Interface para las respuestas del bot
export interface BotResponse {
	message: string;
	options?: BotOption[];
	media?: string;
}

// Interface para las opciones de respuesta
export interface BotOption {
	id: string;
	text: string;
	value: string;
}
