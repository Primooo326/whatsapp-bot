export interface Usuario {
    uuid: string; // Identificador único universal del usuario
    nombre: string;
    telefono: string;
    correo: string; // Ahora es obligatorio (ya no tiene el signo ?)
    contraseña: string;
    status: 0 | 1; // Solo puede ser 0 o 1
    sessionId: string;
}

export interface Bot {
    uuid: string; // Identificador único universal del bot
    usuarioId: string; // UUID del usuario propietario del bot
    nombre: string; // Nombre del bot
    descripcion: string; // Descripción del bot
    status: "activo" | "inactivo" | "suspendido"; // Estado del bot
}

export interface CanalEnvio {
    tipo: "email" | "telefono"; // Tipo de canal: email o teléfono
    direccion: string; // Dirección del canal: correo electrónico o número de teléfono
}

export interface ArchivoAdjunto {
    tipo: "imagen" | "pdf" | "word" | "video"; // Tipo de archivo
    nombre: string; // Nombre del archivo
    url: string; // URL o ruta del archivo
}

export interface ProgramacionEnvio {
    fecha: string; // Fecha programada en formato ISO (YYYY-MM-DD)
    hora: string; // Hora programada en formato 24 horas (HH:mm)
}

export interface JobEnvioMensaje {
    id: string; // Identificador único del job
    botId: string; // UUID del bot que crea el job
    destinatarios: CanalEnvio[]; // Lista de canales de envío (email o teléfono)
    mensaje: string; // Cuerpo del mensaje
    archivosAdjuntos?: ArchivoAdjunto[]; // Lista de archivos adjuntos (opcional)
    programacionEnvio?: ProgramacionEnvio; // Fecha y hora programada para el envío (opcional)
    creadoEn: Date; // Fecha y hora en que se creó el job
    status: "pendiente" | "enviado" | "fallido"; // Estado del job
}