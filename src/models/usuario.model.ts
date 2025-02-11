export interface Usuario {
	id_usuario?: number;
	numeroTelefono: string;
	nombre: string;
	direccion: string;
	preferencias?: string;
	fechaRegistro?: Date;
}
