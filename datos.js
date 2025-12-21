// ====== VARIABLES DE ESTADO Y ALMACENAMIENTO ======

// Exportamos las variables para usarlas en otros archivos
export let productos = JSON.parse(localStorage.getItem('productos')) || {};
export let ventas = JSON.parse(localStorage.getItem('ventas')) || [];

// Funciones para guardar
export function guardarProductos() {
    localStorage.setItem('productos', JSON.stringify(productos));
}

export function guardarVentas() {
    localStorage.setItem('ventas', JSON.stringify(ventas));
}

// Función auxiliar para eliminar una venta (usada en anulaciones)
export function eliminarVentaDeMemoria(index) {
    ventas.splice(index, 1);
    guardarVentas();
}

// Función auxiliar para agregar venta
export function agregarVentaAMemoria(venta) {
    ventas.push(venta);
    guardarVentas();
}