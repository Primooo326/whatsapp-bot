export interface IUser {
    id: string;
    username: string;
    email: string;
    password_hash: string;
    created_at: Date;
    updated_at: Date;
}

export interface IBot {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    status: BotStatus;
    created_at: Date;
    updated_at: Date;
}

export interface IChannel {
    id: string;
    channel_type: ChannelType;
    channel_account: string;
    created_at: Date;
    updated_at: Date;
}

export interface IContact {
    id: string;
    name?: string;
    channel_id?: string;
    created_at: Date;
    updated_at: Date;
}

export interface IContactGroup {
    id: string;
    bot_id: string;
    name: string;
    description?: string;
    created_at: Date;
    updated_at: Date;
}

export interface IContactGroupMember {
    group_id: string;
    contact_id: string;
}

export interface IService {
    id: string;
    bot_id: string;
    name: string;
    category: ServiceCategory;
    description?: string;
    scheduled_date?: string;
    scheduled_type: ServiceScheduledType;
    status: ServiceStatus;
    created_at: Date;
    updated_at: Date;
}

export interface IServiceExecution {
    id: string;
    service_id: string;
    contact_id?: string;
    executed_at: Date;
    status: ServiceExecutionStatus;
    created_at: Date;
    updated_at: Date;
}

export interface IServiceContent {
    id: string;
    service_id: string;
    message_body: string;
    attachments_url?: IAttachment[];
    created_at: Date;
    updated_at: Date;
}

export interface IAttachment {
    id: string;
    url: string;
    description?: string;
    created_at: Date;
    updated_at: Date;
}

export enum ServiceCategory {
    MASSIVE_MESSAGE = 'Servicio de mensajes masivos',
    CONVERSATION_FLOW = 'Servicio de flujos de conversación',
    IA_PROMPT = 'Servicio de prompts con IA'
}

export enum ServiceScheduledType {
    SCHEDULED = 'programado',
    ONCE = 'unaVez'
}

export enum ServiceStatus {
    SCHEDULED = 'programado',
    EXECUTED = 'ejecutado',
    WITH_ALERTS = 'con alertas',
    FAILED = 'fallido'
}

export enum ChannelType {
    EMAIL = 'correo',
    PHONE = 'telefono'
}

export enum ServiceExecutionStatus {
    READ = 'leido',
    SENT = 'enviado',
    NOT_FOUND = 'no encontrado'
}

export enum BotStatus {
    ACTIVE = 'activo',
    INACTIVE = 'inactivo'
}


