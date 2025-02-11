export interface Pedido {
	id_pedido?: number;
	idUsuario: number;
	fechaPedido?: Date;
	estado?: 'pendiente' | 'en_preparacion' | 'entregado' | 'cancelado';
	total: number;
	detalles: DetallePedido[];
}

export interface DetallePedido {
	id_detalle?: number;
	id_pedido?: number;
	idPlato: number;
	cantidad: number;
	subtotal: number;
}

// Interface para respuestas agregadas
export interface PedidoConDetalles extends Pedido {
	detallesCompletos?: DetalleConProducto[];
}

export interface DetalleConProducto extends DetallePedido {
	nombre_plato?: string;
	precio_unitario?: number;
}
