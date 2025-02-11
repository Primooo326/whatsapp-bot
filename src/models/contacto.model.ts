export interface Contacto {
	id_contacto?: number;
	idUsuario: number;
	mensaje: string;
	fechaMensaje?: Date;
	estado?: 'pendiente' | 'respondido';
}
