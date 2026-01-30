// ====== IMPORTACIONES ======
import { productos, ventas, guardarProductos, guardarVentas, agregarVentaAMemoria, eliminarVentaDeMemoria } from './datos.js';
import { actualizarGraficos } from './graficos.js';

// ====== VARIABLES LOCALES ======
let carrito = [];
let total = 0;
let productoSeleccionado = null;
let categoriaActiva = '';

// ==========================================
//  CONEXIÓN CON EL HTML (GLOBALIZACIÓN)
// ==========================================
window.guardarProducto = guardarProducto;
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.filtrarProductos = filtrarProductos;
window.mostrarInventario = mostrarInventario;
window.agregarAlCarrito = agregarAlCarrito;
window.finalizarVenta = finalizarVenta;
window.nuevaVenta = nuevaVenta;
window.imprimirTicket = imprimirTicket;
window.verReporte = verReporte;
window.exportarAExcel = exportarAExcel;
window.cerrarCaja = cerrarCaja;
window.reiniciarReporte = reiniciarReporte;
window.cambiarVista = cambiarVista;
window.actualizarHistorial = actualizarHistorial;
window.anularVenta = anularVenta;
window.cambiarCategoria = cambiarCategoria;
window.prepararTicket = prepararTicket;

// ====== GESTIÓN DE PRODUCTOS ======
function guardarProducto() {
    const nombre = document.getElementById('nombre').value.trim();
    const codigoBarras = document.getElementById('codigoBarras').value.trim();
    const categoria = document.getElementById('categoria').value;
    const precio = parseFloat(document.getElementById('precio').value);
    const stock = parseInt(document.getElementById('stock').value);
    const costo = parseFloat(document.getElementById('costo').value) || 0;
    const esPromo = document.getElementById('esPromo').checked;

    if (!nombre || isNaN(precio) || precio <= 0 || isNaN(stock) || stock < 0) {
        Swal.fire({ icon: 'error', title: 'Datos inválidos', text: 'Verifique los campos obligatorios.' });
        return;
    }

    if (codigoBarras) {
        const productoExistente = Object.entries(productos).find(
            ([nom, prod]) => prod.codigoBarras === codigoBarras && nom !== nombre
        );
        if (productoExistente) {
            Swal.fire('Código duplicado', `Asignado a: ${productoExistente[0]}`, 'warning');
            return;
        }
    }

    productos[nombre] = { precio, costo, stock, categoria, esPromo, codigoBarras: codigoBarras || null };
    guardarProductos(); 
    
    Swal.fire({ icon: 'success', title: '¡Guardado!', timer: 1500, showConfirmButton: false });
    
    // Limpiar campos
    document.getElementById('nombre').value = '';
    document.getElementById('codigoBarras').value = '';
    document.getElementById('costo').value = '';
    document.getElementById('precio').value = '';
    document.getElementById('stock').value = '';
    document.getElementById('esPromo').checked = false;
    
    mostrarInventario();
}

// ====== INVENTARIO ======
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
            <div class="producto-acciones">
                <button class="btn-editar" onclick="event.stopPropagation(); editarProducto('${nombre}')">✏️</button>
                <button class="btn-eliminar" onclick="event.stopPropagation(); eliminarProducto('${nombre}')">🗑️</button>
            </div>
        `;
        contenedor.appendChild(card);
    });
}

function obtenerIconoCategoria(cat) {
    const iconos = { 'Bebidas': '🥤', 'Snacks': '🍿',  'Almacén': '🛒', 'Limpieza': '🧹', 'Otros': '📌' };
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

// ====== EDICIÓN Y ELIMINACIÓN ======
function editarProducto(nombre) {
    const prod = productos[nombre];
    if (!prod) return;

    cambiarVista('admin'); 
    
    document.getElementById('nombre').value = nombre;
    document.getElementById('codigoBarras').value = prod.codigoBarras || '';
    document.getElementById('categoria').value = prod.categoria;
    document.getElementById('costo').value = prod.costo || 0;
    document.getElementById('precio').value = prod.precio;
    document.getElementById('stock').value = prod.stock;
    document.getElementById('esPromo').checked = prod.esPromo || false;
    
    setTimeout(() => {
        const panel = document.querySelector('.panel-productos');
        if(panel) {
            panel.scrollIntoView({ behavior: 'smooth' });
            panel.style.border = '3px solid var(--primary)';
            setTimeout(() => panel.style.border = '1px solid var(--border)', 2000);
        }
    }, 100);
}

function eliminarProducto(nombre) {
    Swal.fire({
        title: '¿Eliminar?',
        text: `Se borrará "${nombre}".`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
        if (result.isConfirmed) {
            delete productos[nombre];
            guardarProductos();
            mostrarInventario();
            Swal.fire('Eliminado', '', 'success');
        }
    });
}

// ====== VENTA ======
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
    if (!productoSeleccionado) { Swal.fire('Error', 'Seleccione un producto', 'warning'); return; }
    
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
    
    // Actualizar tabla visual
    const fila = document.getElementById('tabla').insertRow();
    fila.insertCell(0).innerText = productoSeleccionado;
    fila.insertCell(1).innerText = cant;
    fila.insertCell(2).innerText = `$${subtotal.toFixed(2)}`;
    
    document.getElementById('total').innerText = `Total: $${total.toFixed(2)}`;
    guardarProductos();
    mostrarInventario();
    
    productoSeleccionado = null;
    document.getElementById('buscador').value = '';
    document.getElementById('ventaCantidad').value = 1;
}

function finalizarVenta() {
    if (carrito.length === 0) {
        Swal.fire('Carrito vacío', 'No hay productos para vender', 'warning');
        return;
    }

    const formaPago = document.getElementById('formaPago').value;
    const pago = parseFloat(document.getElementById('pago').value || 0);

    if (formaPago === 'efectivo') {
        if (pago < total) {
            Swal.fire('Pago insuficiente', 'El monto ingresado es menor al total', 'error');
            return;
        }
        document.getElementById('vuelto').innerText = `Vuelto: ${(pago - total).toFixed(2)}`;
    } else {
        document.getElementById('vuelto').innerText = '';
    }

    const hoy = new Date();
    const venta = {
        fecha: hoy.getFullYear() + '-' + 
               String(hoy.getMonth() + 1).padStart(2, '0') + '-' + 
               String(hoy.getDate()).padStart(2, '0'),
        fechaLegible: hoy.toLocaleDateString('es-AR'),
        hora: hoy.toLocaleTimeString('es-AR'),
        total: total,
        formaPago: formaPago,
        pago: pago,
        vuelto: pago - total,
        detalle: JSON.parse(JSON.stringify(carrito))
    };

    agregarVentaAMemoria(venta);
    actualizarGraficos(ventas, productos);
    actualizarHistorial();

    prepararTicket(venta); 
    const btnPrint = document.getElementById('btnImprimirTicket');
    if(btnPrint) btnPrint.style.display = 'block';

    Swal.fire({
        icon: 'success',
        title: '¡Venta Exitosa!',
        text: 'Venta registrada correctamente',
        timer: 2000,
        showConfirmButton: false
    }).then(() => {
        // Limpieza automática
        nuevaVenta();
    });
}

function nuevaVenta() {
    carrito = [];
    total = 0;
    productoSeleccionado = null;
    document.getElementById('tabla').innerHTML = '<tr><th>Prod.</th><th>Cant.</th><th>Subt.</th></tr>';
    document.getElementById('total').innerText = 'Total: $0.00';
    document.getElementById('vuelto').innerText = '';
    document.getElementById('pago').value = '';
    
    const btnPrint = document.getElementById('btnImprimirTicket');
    if(btnPrint) btnPrint.style.display = 'none';
}

// ====== NAVEGACIÓN Y VISTAS ======
function cambiarVista(nombreVista) {
    // Ocultar todas las vistas
    document.querySelectorAll('.vista').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    // Mostrar la vista seleccionada
    const vistaElement = document.getElementById('vista-' + nombreVista);
    if (vistaElement) {
        vistaElement.classList.add('active');
    } else {
        console.error('No se encontró la vista:', nombreVista);
    }
    
    // Activar botón correspondiente buscando por el texto del onclick
    document.querySelectorAll('.nav-btn').forEach(btn => {
        const onClickAttr = btn.getAttribute('onclick');
        if(onClickAttr && onClickAttr.includes(`'${nombreVista}'`)) {
            btn.classList.add('active');
        }
    });

    // Acciones específicas por vista
    if (nombreVista === 'caja') {
        setTimeout(() => {
            actualizarGraficos(ventas, productos);
        }, 100);
    }
    
    if (nombreVista === 'admin') {
        actualizarHistorial();
    }
}

// ====== REPORTES Y EXCEL ======
function verReporte() {
    const reporteDiv = document.getElementById('reporte');
    if (!reporteDiv) return;

    const hoy = new Date();
    const fechaHoy = hoy.getFullYear() + '-' + 
                     String(hoy.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(hoy.getDate()).padStart(2, '0');
    
    let totalDia = 0;
    let resumenPagos = { efectivo: 0, transferencia: 0, tarjeta: 0 };
    let ventasHoy = 0;

    ventas.forEach(v => {
        let esHoy = false;
        if (v.fecha === fechaHoy) {
            esHoy = true;
        } else if (v.fecha && v.fecha.includes('/')) {
            const partes = v.fecha.split('/');
            if (partes.length === 3) {
                const fechaConv = partes[2] + '-' + 
                                 partes[1].padStart(2, '0') + '-' + 
                                 partes[0].padStart(2, '0');
                esHoy = (fechaConv === fechaHoy);
            }
        }
        
        if (esHoy) {
            ventasHoy++;
            totalDia += v.total || 0;
            if (resumenPagos[v.formaPago] !== undefined) {
                resumenPagos[v.formaPago] += v.total || 0;
            }
        }
    });

    let texto = `REPORTE DIARIO - ${hoy.toLocaleDateString('es-AR')}\n\n`;
    texto += `💰 VENDIDO: $${totalDia.toFixed(2)}\n`;
    texto += `📊 CANT. VENTAS: ${ventasHoy}\n\n`;
    texto += `PAGOS:\n`;
    texto += `• Efectivo: $${resumenPagos.efectivo.toFixed(2)}\n`;
    texto += `• Transf:   $${resumenPagos.transferencia.toFixed(2)}\n`;
    texto += `• Tarjeta:  $${resumenPagos.tarjeta.toFixed(2)}\n`;

    reporteDiv.innerText = texto;
    reporteDiv.style.display = 'block';
}

function cerrarCaja() {
    verReporte();
    Swal.fire('Caja Cerrada', 'El reporte está listo.', 'success');
}

function actualizarHistorial() {
    const lista = document.getElementById('listaHistorial');
    if (!lista) return;
    
    lista.innerHTML = '';
    
    const hoy = new Date();
    const fechaHoy = hoy.getFullYear() + '-' + 
                     String(hoy.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(hoy.getDate()).padStart(2, '0');
    
    const ventasHoy = ventas
        .map((v, i) => ({...v, idx: i}))
        .filter(v => {
            if (v.fecha === fechaHoy) return true;
            if (v.fecha && v.fecha.includes('/')) {
                const partes = v.fecha.split('/');
                const fechaConv = partes[2] + '-' + partes[1].padStart(2, '0') + '-' + partes[0].padStart(2, '0');
                return fechaConv === fechaHoy;
            }
            return false;
        })
        .reverse();
    
    if (ventasHoy.length === 0) {
        lista.innerHTML = '<tr><td colspan="5" style="text-align: center;">Sin ventas hoy</td></tr>';
        return;
    }

    ventasHoy.forEach(v => {
        const tr = document.createElement('tr');
        const cantItems = v.detalle ? v.detalle.length : 0;
        
        tr.innerHTML = `
            <td>${v.hora || 'N/A'}</td>
            <td>${cantItems} items</td>
            <td style="font-weight: bold; color: #16a34a;">$${(v.total || 0).toFixed(2)}</td>
            <td style="text-transform: capitalize;">${v.formaPago || 'N/A'}</td>
            <td><button class="btn-eliminar" onclick="anularVenta(${v.idx})" style="padding: 2px 8px;">✕</button></td>
        `;
        lista.appendChild(tr);
    });
}

function anularVenta(index) {
    Swal.fire({
        title: '¿Anular venta?',
        text: 'Se restaurará el stock.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Sí, anular'
    }).then((result) => {
        if (result.isConfirmed) {
            const v = ventas[index];
            if (v.detalle && Array.isArray(v.detalle)) {
                v.detalle.forEach(item => {
                    if (productos[item.producto]) {
                        productos[item.producto].stock += (item.cantidad || 0);
                    }
                });
            }
            guardarProductos();
            eliminarVentaDeMemoria(index);
            
            actualizarHistorial();
            actualizarGraficos(ventas, productos);
            verReporte();
            mostrarInventario();
            
            Swal.fire('Venta anulada', '', 'success');
        }
    });
}

function exportarAExcel() {
    const hoy = new Date();
    const fechaHoy = hoy.getFullYear() + '-' + 
                     String(hoy.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(hoy.getDate()).padStart(2, '0');
    
    let totalDia = 0;
    let ventasHoy = [];

    ventas.forEach(v => {
        let esHoy = false;
        if (v.fecha === fechaHoy) esHoy = true;
        else if (v.fecha && v.fecha.includes('/')) {
            const partes = v.fecha.split('/');
            const fechaConv = partes[2] + '-' + partes[1].padStart(2, '0') + '-' + partes[0].padStart(2, '0');
            esHoy = (fechaConv === fechaHoy);
        }
        
        if (esHoy) {
            ventasHoy.push(v);
            totalDia += v.total || 0;
        }
    });
    
    if (ventasHoy.length === 0) {
        Swal.fire({ icon: 'warning', title: 'Sin datos', text: 'No hay ventas hoy.' });
        return;
    }
    
    let csv = 'REPORTE DIARIO - ' + fechaHoy + '\n\n';
    csv += 'Fecha;Hora;Forma Pago;Total;Productos\n';
    
    ventasHoy.forEach(v => {
        const prodStr = v.detalle ? v.detalle.map(d => d.producto + ' x' + d.cantidad).join(' | ') : '';
        csv += `${v.fecha};${v.hora};${v.formaPago};$${v.total};${prodStr}\n`;
    });
    
    csv += `\nTOTAL;$${totalDia}\n`;

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_${fechaHoy}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function reiniciarReporte() {
    verReporte();
    Swal.fire('Reporte Actualizado', '', 'success');
}

// ====== TICKET E IMPRESIÓN ======
function prepararTicket(venta) {
    const elFecha = document.getElementById('ticketFecha');
    const elHora = document.getElementById('ticketHora');
    if (elFecha) elFecha.innerText = venta.fechaLegible;
    if (elHora) elHora.innerText = venta.hora;
    
    const tbody = document.getElementById('ticketDetalle');
    if (tbody) {
        tbody.innerHTML = '';
        venta.detalle.forEach(item => {
            const precioUnitario = item.subtotal / item.cantidad;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.producto}</td>
                <td>${item.cantidad}</td>
                <td>$${precioUnitario.toFixed(2)}</td>
                <td>$${item.subtotal.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    const elTotal = document.getElementById('ticketTotal');
    if (elTotal) elTotal.innerText = `TOTAL: $${venta.total.toFixed(2)}`;
    
    const elForma = document.getElementById('ticketFormaPago');
    if (elForma) elForma.innerText = `Medio: ${venta.formaPago.toUpperCase()}`;
    
    if (venta.pago) {
        const elPago = document.getElementById('ticketPago');
        const elVuelto = document.getElementById('ticketVuelto');
        if (elPago) elPago.innerText = `Pago: $${venta.pago.toFixed(2)}`;
        if (elVuelto) elVuelto.innerText = `Vuelto: $${venta.vuelto.toFixed(2)}`;
    }
}

function imprimirTicket() {
    window.print();
}

// ====== MODO OSCURO ======
const btnTema = document.getElementById('btnTema');
if (btnTema) {
    if (localStorage.getItem('tema') === 'oscuro') {
        document.body.classList.add('dark-mode');
        btnTema.innerText = '☀️';
    }
    btnTema.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const esOscuro = document.body.classList.contains('dark-mode');
        localStorage.setItem('tema', esOscuro ? 'oscuro' : 'claro');
        btnTema.innerText = esOscuro ? '☀️' : '🌙';
    });
}

// ====== EVENT LISTENERS ======
const bind = (id, evento, funcion) => {
    const el = document.getElementById(id);
    if(el) el.addEventListener(evento, funcion);
};

bind('btnGuardarProducto', 'click', guardarProducto);
bind('buscador', 'keyup', filtrarProductos);
bind('buscadorInventario', 'keyup', mostrarInventario);
bind('btnAgregar', 'click', agregarAlCarrito);
bind('btnFinalizar', 'click', finalizarVenta);
bind('btnNueva', 'click', nuevaVenta);
bind('btnImprimirTicket', 'click', imprimirTicket);
bind('btnReporte', 'click', verReporte);
bind('btnExportarExcel', 'click', exportarAExcel);
bind('btnCerrarCaja', 'click', cerrarCaja);
bind('btnReiniciarReporte', 'click', reiniciarReporte);

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => cambiarCategoria(btn.dataset.categoria));
});

window.addEventListener('load', () => {
    mostrarInventario();
    verReporte();
    actualizarHistorial();
    actualizarGraficos(ventas, productos);
});