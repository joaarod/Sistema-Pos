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
// Asignamos las funciones a 'window' para que el HTML pueda usarlas
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
    const iconos = { 'Bebidas': '🥤', 'Snacks': '🍿', 'Fiambres': '🥩', 'Almacén': '🛒', 'Limpieza': '🧹', 'Otros': '📌' };
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
        timer: 2000,
        showConfirmButton: false
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
// ====== NAVEGACIÓN Y VISTAS (BUSCA ESTA FUNCIÓN EN TU APP.JS Y REEMPLÁZALA) ======
function cambiarVista(nombreVista) {
    console.log('🔄 Cambiando a vista:', nombreVista);
    
    // Ocultar todas las vistas
    document.querySelectorAll('.vista').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    // Mostrar la vista seleccionada
    const vistaElement = document.getElementById('vista-' + nombreVista);
    if (vistaElement) {
        vistaElement.classList.add('active');
    }
    
    // Activar botón correspondiente
    const btns = document.querySelectorAll('.nav-btn');
    if (nombreVista === 'venta') btns[0].classList.add('active');
    if (nombreVista === 'admin') btns[1].classList.add('active');
    if (nombreVista === 'caja') btns[2].classList.add('active');

    // Acciones específicas por vista
    if (nombreVista === 'caja') {
        console.log('📊 Vista de Caja - preparando gráficos...');
        
        // Esperar a que el DOM esté listo (MUY IMPORTANTE)
        setTimeout(() => {
            console.log('🎨 Actualizando gráficos ahora...');
            actualizarGraficos(ventas, productos);
        }, 300); // Aumentado a 300ms
    }
    
    if (nombreVista === 'admin') {
        actualizarHistorial();
    }
}

// ====== BUSCA ESTAS FUNCIONES EN TU APP.JS Y REEMPLÁZALAS ======

// ====== REPORTES Y EXCEL ======
function verReporte() {
    const reporteDiv = document.getElementById('reporte');
    if (!reporteDiv) return;

    const hoy = new Date();
    const fechaHoy = hoy.getFullYear() + '-' + 
                     String(hoy.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(hoy.getDate()).padStart(2, '0');
    const fechaLegible = hoy.toLocaleDateString('es-AR');
    
    console.log('📊 Generando reporte para:', fechaHoy);
    
    let totalDia = 0;
    let gananciaDia = 0;
    let resumenProductos = {};
    let resumenPagos = { efectivo: 0, transferencia: 0, tarjeta: 0 };
    let ventasHoy = 0;

    // Filtrar ventas de hoy
    ventas.forEach(v => {
        // Comparar fechas de forma flexible
        let esHoy = false;
        
        if (v.fecha === fechaHoy) {
            esHoy = true;
        } else if (v.fecha && v.fecha.includes('/')) {
            // Convertir DD/MM/YYYY a YYYY-MM-DD
            const partes = v.fecha.split('/');
            if (partes.length === 3) {
                const fechaConv = partes[2] + '-' + 
                                 partes[1].padStart(2, '0') + '-' + 
                                 partes[0].padStart(2, '0');
                esHoy = (fechaConv === fechaHoy);
            }
        }
        
        if (esHoy) {
            console.log('  ✅ Venta encontrada:', v);
            ventasHoy++;
            totalDia += v.total || 0;
            
            // Sumar por forma de pago
            if (resumenPagos[v.formaPago] !== undefined) {
                resumenPagos[v.formaPago] += v.total || 0;
            }
            
            // Procesar detalle de productos
            if (v.detalle && Array.isArray(v.detalle)) {
                v.detalle.forEach(d => {
                    const nombreProd = d.producto;
                    resumenProductos[nombreProd] = (resumenProductos[nombreProd] || 0) + (d.cantidad || 0);
                    
                    // Calcular ganancia si existe el producto
                    const prod = productos[nombreProd];
                    if (prod && prod.costo) {
                        const costo = prod.costo * (d.cantidad || 0);
                        gananciaDia += (d.subtotal || 0) - costo;
                    }
                });
            }
        }
    });

    console.log('💰 Total del día:', totalDia);
    console.log('📊 Ventas encontradas:', ventasHoy);

    let texto = `REPORTE DIARIO - ${fechaLegible}\n\n`;
    texto += `💰 VENDIDO: $${totalDia.toFixed(2)}`;
    
    if (gananciaDia > 0) {
        texto += ` | 📈 GANANCIA: $${gananciaDia.toFixed(2)}`;
    }
    
    texto += `\n\n`;
    texto += `PAGOS: Efectivo($${resumenPagos.efectivo.toFixed(2)}) `;
    texto += `Transf($${resumenPagos.transferencia.toFixed(2)}) `;
    texto += `Tarjeta($${resumenPagos.tarjeta.toFixed(2)})\n`;
    
    texto += `\nPRODUCTOS:\n`;
    
    if (Object.keys(resumenProductos).length > 0) {
        for (let p in resumenProductos) {
            texto += `• ${p}: ${resumenProductos[p]} unidades\n`;
        }
    } else {
        texto += '(No hay productos registrados)\n';
    }

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
    
    console.log('📜 Actualizando historial para:', fechaHoy);
    
    // Filtrar y mapear ventas con índice
    const ventasHoy = ventas
        .map((v, i) => ({...v, idx: i}))
        .filter(v => {
            // Comparar fechas de forma flexible
            if (v.fecha === fechaHoy) return true;
            
            if (v.fecha && v.fecha.includes('/')) {
                const partes = v.fecha.split('/');
                if (partes.length === 3) {
                    const fechaConv = partes[2] + '-' + 
                                     partes[1].padStart(2, '0') + '-' + 
                                     partes[0].padStart(2, '0');
                    return fechaConv === fechaHoy;
                }
            }
            return false;
        })
        .reverse(); // Más recientes primero
    
    console.log('📋 Ventas de hoy para historial:', ventasHoy.length);
    
    if (ventasHoy.length === 0) {
        lista.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #94a3b8;">Sin ventas hoy</td></tr>';
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
            <td><button class="btn-eliminar" onclick="anularVenta(${v.idx})" style="padding: 5px 10px; font-size: 12px;">✕ Anular</button></td>
        `;
        lista.appendChild(tr);
    });
}

function anularVenta(index) {
    Swal.fire({
        title: '¿Anular venta?',
        text: 'Se restaurará el stock de los productos',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, anular',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const v = ventas[index];
            
            // Restaurar stock
            if (v.detalle && Array.isArray(v.detalle)) {
                v.detalle.forEach(item => {
                    if (productos[item.producto]) {
                        productos[item.producto].stock += (item.cantidad || 0);
                    }
                });
            }
            
            guardarProductos();
            eliminarVentaDeMemoria(index);
            
            // Actualizar todo
            actualizarHistorial();
            actualizarGraficos(ventas, productos);
            verReporte();
            mostrarInventario();
            
            Swal.fire({
                title: 'Venta anulada',
                text: 'Stock restaurado correctamente',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        }
    });
}
// ====== BUSCA ESTA FUNCIÓN EN TU APP.JS Y REEMPLÁZALA ======

function exportarAExcel() {
    const hoy = new Date();
    const fechaHoy = hoy.getFullYear() + '-' + 
                     String(hoy.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(hoy.getDate()).padStart(2, '0');
    const fechaLegible = hoy.toLocaleDateString('es-AR');
    
    console.log('📥 Exportando reporte para:', fechaHoy);
    
    let totalDia = 0;
    let resumenProductos = {};
    let resumenPagos = { efectivo: 0, transferencia: 0, tarjeta: 0 };
    let ventasHoy = [];

    // Filtrar ventas de hoy
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
            ventasHoy.push(v);
            totalDia += v.total || 0;
            
            if (resumenPagos[v.formaPago] !== undefined) {
                resumenPagos[v.formaPago] += v.total || 0;
            }
            
            if (v.detalle && Array.isArray(v.detalle)) {
                v.detalle.forEach(d => {
                    const prod = d.producto;
                    resumenProductos[prod] = (resumenProductos[prod] || 0) + (d.cantidad || 0);
                });
            }
        }
    });
    
    console.log('📊 Ventas a exportar:', ventasHoy.length);
    
    if (ventasHoy.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Sin datos',
            text: 'No hay ventas de hoy para exportar'
        });
        return;
    }
    
    // Crear contenido CSV
    let csv = 'REPORTE DIARIO - ' + fechaLegible + '\n\n';
    
    // RESUMEN
    csv += 'RESUMEN DEL DIA\n';
    csv += 'Total Vendido;$' + totalDia.toFixed(2) + '\n';
    csv += 'Numero de Ventas;' + ventasHoy.length + '\n\n';
    
    // FORMAS DE PAGO
    csv += 'FORMAS DE PAGO\n';
    csv += 'Forma de Pago;Total\n';
    csv += 'Efectivo;$' + resumenPagos.efectivo.toFixed(2) + '\n';
    csv += 'Transferencia;$' + resumenPagos.transferencia.toFixed(2) + '\n';
    csv += 'Tarjeta;$' + resumenPagos.tarjeta.toFixed(2) + '\n\n';
    
    // PRODUCTOS VENDIDOS
    csv += 'PRODUCTOS VENDIDOS\n';
    csv += 'Producto;Cantidad\n';
    for (let p in resumenProductos) {
        csv += p + ';' + resumenProductos[p] + '\n';
    }
    csv += '\n';
    
    // DETALLE DE VENTAS
    csv += 'DETALLE DE VENTAS\n';
    csv += 'Fecha;Hora;Forma de Pago;Total;Productos\n';
    
    ventasHoy.forEach(v => {
        const productos = v.detalle 
            ? v.detalle.map(d => d.producto + ' x' + d.cantidad).join(' | ')
            : 'Sin detalle';
        
        csv += (v.fechaLegible || v.fecha) + ';';
        csv += (v.hora || 'N/A') + ';';
        csv += (v.formaPago || 'N/A') + ';';
        csv += '$' + (v.total || 0).toFixed(2) + ';';
        csv += '"' + productos + '"\n';
    });
    
    console.log('✅ CSV generado, tamaño:', csv.length, 'caracteres');
    
    // Crear y descargar archivo
    const BOM = '\uFEFF'; // Para que Excel reconozca UTF-8
    const blob = new Blob([BOM + csv], { 
        type: 'text/csv;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'Reporte_' + fechaHoy + '.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Liberar memoria
    URL.revokeObjectURL(url);
    
    Swal.fire({
        icon: 'success',
        title: '¡Exportado!',
        text: 'Archivo: Reporte_' + fechaHoy + '.csv',
        timer: 2000,
        showConfirmButton: false
    });
    
    console.log('📥 Descarga iniciada');
}

function reiniciarReporte() {
    verReporte();
    Swal.fire('Actualizado', 'Reporte sincronizado.', 'success');
}

// ====== TICKET E IMPRESIÓN (FUNCIONES RECUPERADAS) ======
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
// ====== FUNCIONES DE DEBUG (AGREGAR AL FINAL DE APP.JS) ======

// Función para ver todas las ventas y sus fechas
window.debugVentas = function() {
    console.log('🔍 DEBUG DE VENTAS');
    console.log('═══════════════════════════════════');
    
    const hoy = new Date();
    const fechaHoy = hoy.getFullYear() + '-' + 
                     String(hoy.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(hoy.getDate()).padStart(2, '0');
    
    console.log('📅 Fecha de HOY:', fechaHoy);
    console.log('📊 Total de ventas:', ventas.length);
    console.log('');
    
    ventas.forEach((v, i) => {
        console.log('Venta ' + (i + 1) + ':');
        console.log('  Fecha guardada:', v.fecha);
        console.log('  Total: $' + v.total);
        console.log('  Forma pago:', v.formaPago);
        console.log('  Es de hoy?', v.fecha === fechaHoy ? 'SI' : 'NO');
        console.log('');
    });
    
    const ventasHoy = ventas.filter(v => v.fecha === fechaHoy);
    console.log('💰 Ventas de HOY:', ventasHoy.length);
};

// Función para crear venta de prueba
window.crearVentaPrueba = function() {
    if (Object.keys(productos).length === 0) {
        alert('No hay productos. Agrega productos primero.');
        return;
    }
    
    const hoy = new Date();
    const fechaFormateada = hoy.getFullYear() + '-' + 
                           String(hoy.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(hoy.getDate()).padStart(2, '0');
    
    const primerProducto = Object.keys(productos)[0];
    const prod = productos[primerProducto];
    
    const ventaPrueba = {
        fecha: fechaFormateada,
        fechaLegible: hoy.toLocaleDateString('es-AR'),
        hora: hoy.toLocaleTimeString('es-AR'),
        total: prod.precio * 2,
        formaPago: 'efectivo',
        pago: prod.precio * 2,
        vuelto: 0,
        detalle: [
            {
                producto: primerProducto,
                cantidad: 2,
                subtotal: prod.precio * 2
            }
        ]
    };
    
    ventas.push(ventaPrueba);
    guardarVentas();
    
    console.log('Venta de prueba creada:', ventaPrueba);
    
    actualizarGraficos(ventas, productos);
    
    alert('Venta de prueba creada para HOY');
};

console.log('');
console.log('FUNCIONES DISPONIBLES:');
console.log('debugVentas() - Ver ventas');
console.log('crearVentaPrueba() - Crear venta de prueba');
console.log('');

