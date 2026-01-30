// ====== POS SIMPLIFICADO - SOLO VENTAS ======
import { productos, ventas, guardarProductos, guardarVentas, agregarVentaAMemoria } from './datos.js';

let carrito = [];
let total = 0;
let productoSeleccionado = null;
let categoriaActiva = '';

// ====== FUNCIÓN PARA VENTA RÁPIDA (SIN REGISTRO) ======
function agregarVentaRapida() {
    const nombre = document.getElementById('nombreRapido').value.trim();
    const precio = parseFloat(document.getElementById('precioRapido').value);
    
    if (!nombre || isNaN(precio) || precio <= 0) {
        Swal.fire('Error', 'Ingrese descripción y precio válido', 'error');
        return;
    }
    
    const subtotal = precio;
    total += subtotal;
    
    carrito.push({ 
        producto: nombre + ' (Venta rápida)', 
        cantidad: 1, 
        subtotal: subtotal,
        esVentaRapida: true
    });
    
    const fila = document.getElementById('tabla').insertRow();
    fila.insertCell(0).innerText = nombre;
    fila.insertCell(1).innerText = '1';
    fila.insertCell(2).innerText = '$' + subtotal.toFixed(2);
    
    const btnEliminar = document.createElement('button');
    btnEliminar.innerText = '✕';
    btnEliminar.className = 'btn-eliminar';
    btnEliminar.style.padding = '4px 8px';
    btnEliminar.style.fontSize = '12px';
    btnEliminar.onclick = () => eliminarDelCarrito(fila, subtotal);
    fila.insertCell(3).appendChild(btnEliminar);
    
    document.getElementById('total').innerText = 'Total: $' + total.toFixed(2);
    
    // Limpiar campos
    document.getElementById('nombreRapido').value = '';
    document.getElementById('precioRapido').value = '';
    document.getElementById('nombreRapido').focus();
}

// ====== ELIMINAR ITEM DEL CARRITO ======
function eliminarDelCarrito(fila, subtotal) {
    const index = fila.rowIndex - 1;
    carrito.splice(index, 1);
    total -= subtotal;
    fila.remove();
    document.getElementById('total').innerText = 'Total: $' + total.toFixed(2);
}

// ====== MOSTRAR INVENTARIO ======
function mostrarInventario() {
    const contenedor = document.getElementById('inventarioLista');
    const buscador = document.getElementById('buscadorInventario').value.toLowerCase();
    contenedor.innerHTML = '';

    const productosFiltrados = Object.entries(productos).filter(([nombre, prod]) => {
        let coincideCategoria = false;
        if (!categoriaActiva) coincideCategoria = true;
        else if (categoriaActiva === 'Promos') coincideCategoria = prod.esPromo === true;
        else coincideCategoria = prod.categoria === categoriaActiva;

        const coincideBusqueda = nombre.toLowerCase().includes(buscador);
        return coincideCategoria && coincideBusqueda;
    });

    if (productosFiltrados.length === 0) {
        contenedor.innerHTML = '<div class="inventario-vacio">📦 No hay productos</div>';
        return;
    }

    productosFiltrados.forEach(([nombre, prod]) => {
        const card = document.createElement('div');
        card.className = 'inventario-card';
        if(prod.esPromo) {
            card.style.border = '2px solid #dc2626';
            card.style.background = '#fff5f5';
        }

        const icono = obtenerIconoCategoria(prod.categoria);
        const etiquetaPromo = prod.esPromo ? '🔥' : '';
        
        card.onclick = () => clickEnCard(nombre);
        
        card.innerHTML = `
            <div class="producto-nombre">${nombre} ${etiquetaPromo}</div>
            <div class="producto-categoria">${icono} ${prod.categoria}</div>
            <div class="producto-precio">$${prod.precio.toFixed(2)}</div>
            <div class="producto-stock ${prod.stock < 5 ? 'bajo' : ''}">Stock: ${prod.stock}</div>
        `;
        contenedor.appendChild(card);
    });
}

function obtenerIconoCategoria(cat) {
    const iconos = { 
        'Bebidas': '🥤', 
        'Snacks': '🍿', 
        'Fiambres': '🥩', 
        'Almacén': '🛒', 
        'Limpieza': '🧹', 
        'Otros': '📌' 
    };
    return iconos[cat] || '📦';
}

function cambiarCategoria(cat) {
    categoriaActiva = cat;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.categoria === cat) btn.classList.add('active');
    });
    mostrarInventario();
}

function clickEnCard(nombre) {
    seleccionarProducto(nombre);
    const buscador = document.getElementById('buscador');
    buscador.style.backgroundColor = '#dcfce7';
    setTimeout(() => buscador.style.backgroundColor = 'white', 300);
}

// ====== BÚSQUEDA Y VENTA ======
function filtrarProductos() {
    const texto = document.getElementById('buscador').value.toLowerCase();
    const lista = document.getElementById('listaProductos');
    lista.innerHTML = '';
    if (!texto) return;

    const resultados = Object.entries(productos).filter(([nombre, p]) => 
        nombre.toLowerCase().includes(texto) || (p.codigoBarras && p.codigoBarras.includes(texto))
    );

    const match = resultados.find(([_, p]) => p.codigoBarras === texto);
    if (match && texto.length > 3) {
        seleccionarProducto(match[0]);
        if (texto.length >= 8) {
            setTimeout(() => { agregarAlCarrito(); document.getElementById('buscador').value = ''; }, 100);
        }
        return;
    }

    resultados.forEach(([nombre, p]) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${nombre}</span> <span>$${p.precio.toFixed(2)}</span>`;
        li.onclick = () => seleccionarProducto(nombre);
        lista.appendChild(li);
    });
}

function seleccionarProducto(nombre) {
    productoSeleccionado = nombre;
    document.getElementById('buscador').value = nombre;
    document.getElementById('listaProductos').innerHTML = '';
}

function agregarAlCarrito() {
    if (!productoSeleccionado) { 
        Swal.fire('Error', 'Seleccione un producto', 'warning'); 
        return; 
    }
    
    const cant = parseInt(document.getElementById('ventaCantidad').value);
    const prod = productos[productoSeleccionado];

    if (prod.stock < cant) {
        Swal.fire('Stock insuficiente', `Quedan ${prod.stock}`, 'error');
        return;
    }

    const subtotal = prod.precio * cant;
    total += subtotal;
    prod.stock -= cant;
    
    carrito.push({ producto: productoSeleccionado, cantidad: cant, subtotal });
    
    const fila = document.getElementById('tabla').insertRow();
    fila.insertCell(0).innerText = productoSeleccionado;
    fila.insertCell(1).innerText = cant;
    fila.insertCell(2).innerText = '$' + subtotal.toFixed(2);
    
    const btnEliminar = document.createElement('button');
    btnEliminar.innerText = '✕';
    btnEliminar.className = 'btn-eliminar';
    btnEliminar.style.padding = '4px 8px';
    btnEliminar.style.fontSize = '12px';
    btnEliminar.onclick = () => {
        prod.stock += cant; // Restaurar stock
        eliminarDelCarrito(fila, subtotal);
    };
    fila.insertCell(3).appendChild(btnEliminar);
    
    document.getElementById('total').innerText = 'Total: $' + total.toFixed(2);
    guardarProductos();
    mostrarInventario();
    
    productoSeleccionado = null;
    document.getElementById('buscador').value = '';
    document.getElementById('ventaCantidad').value = 1;
}

// En pos.js

function finalizarVenta() {
    if (carrito.length === 0) {
        Swal.fire('Carrito vacío', 'No hay productos para vender', 'warning');
        return;
    }

    const formaPago = document.getElementById('formaPago').value;
    const pago = parseFloat(document.getElementById('pago').value || 0);

    if (formaPago === 'efectivo') {
        if (pago < total) {
            Swal.fire('Pago insuficiente', 'El monto es menor al total', 'error');
            return;
        }
        document.getElementById('vuelto').innerText = `Vuelto: $${(pago - total).toFixed(2)}`;
    }

    const hoy = new Date();
    const venta = {
        fecha: hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0'),
        fechaLegible: hoy.toLocaleDateString('es-AR'),
        hora: hoy.toLocaleTimeString('es-AR'),
        total: total,
        formaPago: formaPago,
        pago: pago,
        vuelto: pago - total,
        detalle: JSON.parse(JSON.stringify(carrito))
    };

    agregarVentaAMemoria(venta);
    prepararTicket(venta);
    
    document.getElementById('btnImprimirTicket').style.display = 'block';

    Swal.fire({
        icon: 'success',
        title: '¡Venta Exitosa!',
        html: `<p style="font-size: 1.5rem; font-weight: bold; color: #16a34a;">Total: $${total.toFixed(2)}</p>`,
        timer: 2000,
        showConfirmButton: false
    }).then(() => {
        // === AQUÍ ESTÁ EL CAMBIO ===
        // Esto limpia la pantalla automáticamente después del cartel verde
        nuevaVenta();
        
        // También limpiamos los inputs de venta rápida por si acaso quedaron con datos
        document.getElementById('nombreRapido').value = '';
        document.getElementById('precioRapido').value = '';
    });
}

function nuevaVenta() {
    carrito = [];
    total = 0;
    productoSeleccionado = null;
    document.getElementById('tabla').innerHTML = '<tr><th>Producto</th><th>Cant.</th><th>Subtotal</th><th></th></tr>';
    document.getElementById('total').innerText = 'Total: $0.00';
    document.getElementById('vuelto').innerText = '';
    document.getElementById('pago').value = '';
    document.getElementById('btnImprimirTicket').style.display = 'none';
}

function prepararTicket(venta) {
    document.getElementById('ticketFecha').innerText = venta.fechaLegible;
    document.getElementById('ticketHora').innerText = venta.hora;
    
    const tbody = document.getElementById('ticketDetalle');
    tbody.innerHTML = '';
    
    venta.detalle.forEach(item => {
        const precioUnit = item.subtotal / item.cantidad;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.producto}</td>
            <td>${item.cantidad}</td>
            <td>$${precioUnit.toFixed(2)}</td>
            <td>$${item.subtotal.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById('ticketTotal').innerText = 'TOTAL: $' + venta.total.toFixed(2);
    document.getElementById('ticketFormaPago').innerText = 'Medio: ' + venta.formaPago.toUpperCase();
    
    if (venta.pago) {
        document.getElementById('ticketPago').innerText = 'Pago: $' + venta.pago.toFixed(2);
        document.getElementById('ticketVuelto').innerText = 'Vuelto: $' + venta.vuelto.toFixed(2);
    }
}

function imprimirTicket() {
    window.print();
}

// ====== GLOBALIZACIÓN ======
window.agregarVentaRapida = agregarVentaRapida;
window.cambiarCategoria = cambiarCategoria;

// ====== EVENT LISTENERS ======
document.getElementById('buscador').addEventListener('keyup', filtrarProductos);
document.getElementById('buscadorInventario').addEventListener('keyup', mostrarInventario);
document.getElementById('btnAgregar').addEventListener('click', agregarAlCarrito);
document.getElementById('btnFinalizar').addEventListener('click', finalizarVenta);
document.getElementById('btnNueva').addEventListener('click', nuevaVenta);
document.getElementById('btnImprimirTicket').addEventListener('click', imprimirTicket);

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => cambiarCategoria(btn.dataset.categoria));
});

// ====== ATAJOS DE TECLADO ======
document.addEventListener('keydown', (e) => {
    if (e.key === 'F4') {
        e.preventDefault();
        document.getElementById('buscador').focus();
    }
    if (e.key === 'Enter' && document.activeElement.id === 'buscador') {
        agregarAlCarrito();
    }
});

// ====== INICIALIZACIÓN ======
window.addEventListener('load', () => {
    mostrarInventario();
    console.log('✅ POS Simplificado cargado');
});
