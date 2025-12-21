// ====== LÓGICA DE GRÁFICOS - FIX COMPLETO ======

let chartCategorias = null;
let chartPagos = null;

// Función para comparar si dos fechas son del mismo día
function esMismoDia(fecha1, fecha2) {
    if (!fecha1 || !fecha2) return false;
    
    // Convertir ambas a objetos Date
    let d1, d2;
    
    // Fecha1 (la de la venta)
    if (typeof fecha1 === 'string') {
        // Formato YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(fecha1)) {
            d1 = new Date(fecha1 + 'T00:00:00');
        }
        // Formato DD/MM/YYYY
        else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(fecha1)) {
            const partes = fecha1.split('/');
            d1 = new Date(partes[2], partes[1] - 1, partes[0]);
        }
        else {
            d1 = new Date(fecha1);
        }
    } else {
        d1 = new Date(fecha1);
    }
    
    // Fecha2 (la de hoy)
    if (typeof fecha2 === 'string') {
        d2 = new Date(fecha2 + 'T00:00:00');
    } else {
        d2 = new Date(fecha2);
    }
    
    // Comparar día, mes y año
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
}

export function actualizarGraficos(ventas, productos) {
    console.log('🎨 Iniciando actualización de gráficos...');
    
    // Verificar Chart.js
    if (typeof Chart === 'undefined') {
        console.error('❌ Chart.js NO cargado');
        return;
    }
    console.log('✅ Chart.js está cargado');
    
    // Verificar canvas
    const canvasCat = document.getElementById('chartCategorias');
    const canvasPag = document.getElementById('chartPagos');
    
    if (!canvasCat || !canvasPag) {
        console.error('❌ Canvas no encontrados');
        return;
    }
    console.log('✅ Canvas encontrados');
    
    // Datos
    console.log('📊 Ventas totales:', ventas.length);
    console.log('📦 Productos totales:', Object.keys(productos).length);
    
    // Fecha de hoy
    const hoy = new Date();
    const fechaHoyStr = hoy.getFullYear() + '-' + 
                        String(hoy.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(hoy.getDate()).padStart(2, '0');
    
    console.log('📅 Buscando ventas de:', fechaHoyStr);
    
    // Mostrar TODAS las fechas para debug
    console.log('🔍 Fechas de todas las ventas:');
    ventas.forEach((v, i) => {
        console.log(`  Venta ${i+1}: fecha="${v.fecha}" (tipo: ${typeof v.fecha})`);
    });
    
    // Filtrar ventas de HOY usando la función flexible
    const ventasHoy = ventas.filter(v => {
        const esHoy = esMismoDia(v.fecha, fechaHoyStr);
        if (esHoy) {
            console.log('  ✅ Venta de hoy:', v.fecha, '$' + v.total);
        }
        return esHoy;
    });
    
    console.log('💰 Ventas de hoy encontradas:', ventasHoy.length);
    
    if (ventasHoy.length === 0) {
        console.warn('⚠️ No hay ventas de hoy para graficar');
        mostrarMensaje(canvasCat, 'Sin ventas hoy');
        mostrarMensaje(canvasPag, 'Sin ventas hoy');
        return;
    }
    
    // CALCULAR DATOS
    const pagos = { efectivo: 0, transferencia: 0, tarjeta: 0 };
    const categorias = {};
    
    ventasHoy.forEach(venta => {
        console.log('  📝 Procesando: $' + venta.total, venta.formaPago);
        
        // Pagos
        if (pagos[venta.formaPago] !== undefined) {
            pagos[venta.formaPago] += venta.total;
        }
        
        // Categorías
        if (venta.detalle && Array.isArray(venta.detalle)) {
            venta.detalle.forEach(item => {
                const prod = productos[item.producto];
                if (prod && prod.categoria) {
                    const cat = prod.categoria;
                    if (!categorias[cat]) categorias[cat] = 0;
                    categorias[cat] += item.subtotal;
                    console.log('    📦', item.producto, '→', cat, '$' + item.subtotal);
                }
            });
        }
    });
    
    console.log('💳 Totales por pago:', pagos);
    console.log('📂 Totales por categoría:', categorias);
    
    // DIBUJAR
    dibujarGraficoCategorias(categorias, canvasCat);
    dibujarGraficoPagos(pagos, canvasPag);
    
    console.log('✅ Gráficos completados');
}

function dibujarGraficoCategorias(datos, canvas) {
    if (chartCategorias) {
        chartCategorias.destroy();
        chartCategorias = null;
    }
    
    const labels = Object.keys(datos);
    const values = Object.values(datos);
    
    if (labels.length === 0) {
        mostrarMensaje(canvas, 'Sin datos');
        return;
    }
    
    try {
        chartCategorias = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        '#2563eb', '#16a34a', '#f59e0b', '#dc2626',
                        '#0891b2', '#8b5cf6', '#ec4899', '#14b8a6'
                    ],
                    borderWidth: 3,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 12,
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                return ctx.label + ': $' + ctx.parsed.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
        console.log('  ✅ Gráfico categorías OK');
    } catch (e) {
        console.error('❌ Error gráfico categorías:', e);
    }
}

function dibujarGraficoPagos(datos, canvas) {
    if (chartPagos) {
        chartPagos.destroy();
        chartPagos = null;
    }
    
    const values = [datos.efectivo, datos.transferencia, datos.tarjeta];
    
    if (values.every(v => v === 0)) {
        mostrarMensaje(canvas, 'Sin datos');
        return;
    }
    
    try {
        chartPagos = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: ['Efectivo', 'Transferencia', 'Tarjeta'],
                datasets: [{
                    label: 'Total',
                    data: values,
                    backgroundColor: ['#16a34a', '#2563eb', '#f59e0b'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(val) {
                                return '$' + val;
                            }
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                return 'Total: $' + ctx.parsed.y.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
        console.log('  ✅ Gráfico pagos OK');
    } catch (e) {
        console.error('❌ Error gráfico pagos:', e);
    }
}

function mostrarMensaje(canvas, texto) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '14px Segoe UI';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(texto, canvas.width / 2, canvas.height / 2);
}