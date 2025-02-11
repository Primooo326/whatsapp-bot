export interface Menu {
	id_plato?: number;
	categoria: 'entrada' | 'plato_principal' | 'postre' | 'bebida';
	nombre_plato: string;
	descripcion?: string;
	precio: number;
	disponible: boolean;
}
