const BANCOS_POR_DEFECTO_USUARIO = {
    3: "BCP", 
    5: "BCP",
    6: "BBVA", 
    9: "BCP", 
    10: "BCP",
    6: "BBVA", 
    11: "BBVA",  
    12: "BBVA", 
    13: "BBVA", 
    14: "BBVA",
    15: "BBVA",
    16: "BBVA",
    17: "Plin",
    18: "Plin"
};

const MAPA_ICONOS_VENTAS = {
    'Comestibles': '🛒', 'Bebidas': '🥤', 'Licores': '🍷',
    'Limpieza': '🧹', 'Cuidado Personal': '🧴', 'Frescos': '🥦',
    'Plasticos': '🍽️', 'Libreria': '✏️', 'Bazar': '🛍️',
    'Yape': '🟣', 'Plin': '🔵', 'BCP': '🟠', 'BBVA': '🔵',
    'Interbank': '🟢', 'Scotiabank': '🔴', 'Efectivo': '💵'
};

let ID_CATEGORIA_POR_DEFECTO = 1;

document.addEventListener('DOMContentLoaded', () => {
    cargarCategoriasVenta();
    cargarMetodosPago();

    const inputYape = document.getElementById('numOperacion');
    const inputTarjeta = document.getElementById('numOperacionTarjeta');

    if(inputYape) inputYape.setAttribute('autocomplete', 'nope');
    if(inputTarjeta) inputTarjeta.setAttribute('autocomplete', 'nope');

    const fY = document.getElementById('formYape');
    if (fY) fY.addEventListener('submit', (e) => procesarPago(e, fY, 'YAPE', 'inputFamilia', 'selectorFamilia'));
    
    const fT = document.getElementById('formTarjeta');
    if (fT) fT.addEventListener('submit', (e) => procesarPago(e, fT, 'TARJETA', 'inputFamiliaTarjeta', 'selectorFamiliaTarjeta'));

    const fTrans = document.getElementById('formTransferencia');
    if (fTrans) fTrans.addEventListener('submit', (e) => procesarPago(e, fTrans, 'TRANSFERENCIA', null, null));
});

async function cargarCategoriasVenta() {
    try {
        const response = await fetch(`${window.BASE_URL}/maestros/categorias`, {
            headers: window.getAuthHeaders()
        });
        if (!response.ok) return;
        const categorias = await response.json();

        const catComestibles = categorias.find(c => c.nombre.toUpperCase().includes('COMESTIBLE'));
        
        if (catComestibles) {
            ID_CATEGORIA_POR_DEFECTO = catComestibles.categoriaID || catComestibles.categoriaId || catComestibles.CategoriaID;
            console.log("✅ Categoría por defecto:", catComestibles.nombre, "(ID:", ID_CATEGORIA_POR_DEFECTO, ")");
        } else {
            ID_CATEGORIA_POR_DEFECTO = 1; 
            console.log("⚠️ No se encontró 'Comestibles', usando ID 1");
        }

        ['selectorFamilia', 'selectorFamiliaTarjeta'].forEach(idContenedor => {
            const contenedor = document.getElementById(idContenedor);
            const idInput = idContenedor === 'selectorFamilia' ? 'inputFamilia' : 'inputFamiliaTarjeta';
            
            if(contenedor) {
                contenedor.innerHTML = ''; 
                let botonPorDefecto = null;

                categorias.forEach(cat => {
                    if(cat.activo) {
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = 'card-familia'; 
                        
                        const catId = cat.categoriaID || cat.categoriaId || cat.CategoriaID;
                        btn.dataset.value = catId;
                        
                        const icono = MAPA_ICONOS_VENTAS[cat.nombre] || '📦';
                        btn.innerHTML = `<span class="emoji">${icono}</span><span class="label">${cat.nombre}</span>`;
                        
                        btn.addEventListener('click', function(e) {
                            e.preventDefault();
                            contenedor.querySelectorAll('.card-familia').forEach(b => b.classList.remove('seleccionado'));
                            this.classList.add('seleccionado');
                            document.getElementById(idInput).value = catId;
                        });

                        if (catId === ID_CATEGORIA_POR_DEFECTO) {
                            botonPorDefecto = btn;
                        }

                        contenedor.appendChild(btn);
                    }
                });

                if (botonPorDefecto) {
                    botonPorDefecto.click();
                } else {
                    const primerBoton = contenedor.querySelector('.card-familia');
                    if (primerBoton) primerBoton.click();
                }
            }
        });
    } catch (e) { console.error("Error cargando categorías:", e); }
}

async function cargarMetodosPago() {
    try {
        const response = await fetch(`${window.BASE_URL}/maestros/entidades`, {
            headers: { 'Authorization': `Bearer ${window.TOKEN}` }
        });
        if (!response.ok) return;
        const entidades = await response.json();

        // -------------------------------------------------------------
        // 1. CARGAR BILLETERAS DIGITALES (YAPE / PLIN)
        // -------------------------------------------------------------
        const contenedorYape = document.getElementById('selectorDestino');
        if(contenedorYape) {
            contenedorYape.innerHTML = '';
            
            entidades.forEach(ent => {
                if(ent.activo && (ent.tipo === 'BILLETERA' || ent.nombre.includes('BCP') || ent.nombre.includes('BBVA'))) {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'chip-banco';
                    btn.dataset.value = ent.entidadID;
                    btn.dataset.nombre = ent.nombre.toUpperCase();
                    
                    let claseDot = 'generic';
                    if(ent.nombre.includes('BCP')) claseDot = 'bcp';
                    if(ent.nombre.includes('BBVA')) claseDot = 'bbva';
                    if(ent.nombre.includes('Yape')) claseDot = 'personal';
                    if(ent.nombre.includes('Plin')) claseDot = 'interbank';

                    btn.innerHTML = `<span class="dot ${claseDot}"></span> ${ent.nombre}`;
                    
                    btn.addEventListener('click', function() {
                        contenedorYape.querySelectorAll('.chip-banco').forEach(b => b.classList.remove('seleccionado'));
                        this.classList.add('seleccionado');
                        document.getElementById('inputDestino').value = ent.entidadID;
                    });
                    contenedorYape.appendChild(btn);
                }
            });

            const nombreBancoPreferido = BANCOS_POR_DEFECTO_USUARIO[window.USUARIO_ID];
            
            if (nombreBancoPreferido) {
                const btnPreferido = Array.from(contenedorYape.querySelectorAll('.chip-banco')).find(b => 
                    b.dataset.nombre.includes(nombreBancoPreferido.toUpperCase())
                );
                
                if (btnPreferido) {
                    btnPreferido.click();
                } else {
                    const primerBtn = contenedorYape.querySelector('.chip-banco');
                    if (primerBtn) primerBtn.click();
                }
            } else {
                const primerBtn = contenedorYape.querySelector('.chip-banco');
                if (primerBtn) primerBtn.click();
            }
        }

        // -------------------------------------------------------------
        // 2. CARGAR BANCOS PARA POS (TARJETAS)
        // -------------------------------------------------------------
        const contenedorTarjeta = document.getElementById('selectorBancoTarjeta');
        if(contenedorTarjeta) {
            contenedorTarjeta.innerHTML = '';
            entidades.forEach(ent => {
                if(ent.activo && ent.tipo === 'BANCO') {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'chip-banco';
                    btn.dataset.value = ent.entidadID;

                    let claseDot = 'generic';
                    if(ent.nombre.includes('Interbank')) claseDot = 'interbank';
                    if(ent.nombre.includes('Scotiabank')) claseDot = 'scotia';
                    
                    btn.innerHTML = `<span class="dot ${claseDot}"></span> ${ent.nombre}`;
                    btn.addEventListener('click', function() {
                        contenedorTarjeta.querySelectorAll('.chip-banco').forEach(b => b.classList.remove('seleccionado'));
                        this.classList.add('seleccionado');
                        document.getElementById('inputBancoTarjeta').value = ent.entidadID;
                    });
                    contenedorTarjeta.appendChild(btn);
                }
            });
            
            const primerBtnTarjeta = contenedorTarjeta.querySelector('.chip-banco');
            if(primerBtnTarjeta) primerBtnTarjeta.click();
        }

        // -------------------------------------------------------------
        // 3. CARGAR BANCOS PARA TRANSFERENCIAS DIRECTAS (NUEVO)
        // -------------------------------------------------------------
        const contenedorTransferencia = document.getElementById('selectorBancoTransferencia');
        if(contenedorTransferencia) {
            contenedorTransferencia.innerHTML = '';
            
            entidades.forEach(ent => {
                // Filtra y muestra SOLO las entidades que sean tipo 'BANCO' y estén activas
                if(ent.activo && ent.tipo === 'BANCO') {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'chip-banco';
                    btn.dataset.value = ent.entidadID;

                    // Asigna un color al puntito dependiendo del nombre del banco
                    let claseDot = 'generic';
                    if(ent.nombre.toUpperCase().includes('BCP')) claseDot = 'bcp';
                    if(ent.nombre.toUpperCase().includes('BBVA')) claseDot = 'bbva';
                    if(ent.nombre.toUpperCase().includes('INTERBANK')) claseDot = 'interbank';
                    if(ent.nombre.toUpperCase().includes('SCOTIA')) claseDot = 'scotia';
                    
                    btn.innerHTML = `<span class="dot ${claseDot}"></span> ${ent.nombre}`;
                    
                    btn.addEventListener('click', function(e) {
                        if(e) e.preventDefault();
                        contenedorTransferencia.querySelectorAll('.chip-banco').forEach(b => b.classList.remove('seleccionado'));
                        this.classList.add('seleccionado');
                        document.getElementById('inputBancoTransferencia').value = ent.entidadID;
                    });
                    
                    contenedorTransferencia.appendChild(btn);
                }
            });
            
            // Selecciona el primer banco de la lista automáticamente
            const primerBtnTrans = contenedorTransferencia.querySelector('.chip-banco');
            if(primerBtnTrans) primerBtnTrans.click();
        }
        
    } catch (e) { 
        console.error(e); 
    }
}

async function procesarPago(e, form, tipo, idInputFam, idContenedorFam) {
    e.preventDefault();

    if (typeof window.CAJA_ABIERTA !== 'undefined' && window.CAJA_ABIERTA === false) {
        window.mostrarNotificacion("🔒 CAJA CERRADA\nAbre turno primero para realizar ventas.", 'error'); return;
    }

    const btn = form.querySelector('.btn-registrar-grande');
    const inputFam = document.getElementById(idInputFam);
    
    // 1. Obtener el monto correcto según el formulario
    let inputMonto;
    if (tipo === 'YAPE') inputMonto = document.getElementById('monto');
    else if (tipo === 'TARJETA') inputMonto = document.getElementById('montoTarjeta');
    else if (tipo === 'TRANSFERENCIA') inputMonto = document.getElementById('montoTransferencia');

    const monto = inputMonto ? parseFloat(inputMonto.value) : 0;

    if (!monto || monto <= 0) { window.mostrarNotificacion("⚠️ Ingresa un monto válido", 'error'); return; }

    let categoriaFinal = typeof ID_CATEGORIA_POR_DEFECTO !== 'undefined' ? ID_CATEGORIA_POR_DEFECTO : 1; 
    if (inputFam && inputFam.value && inputFam.value.trim() !== "") {
        categoriaFinal = parseInt(inputFam.value);
    }

    let entidadId = 1, numOp = null, compId = 2, comprobanteExt = null, titularTransferencia = null; 

    // 2. Validar datos según el tipo de venta
    if (tipo === 'YAPE') {
        const valDestino = document.getElementById('inputDestino').value;
        if (valDestino && valDestino.trim() !== "") entidadId = valDestino;
        numOp = document.getElementById('numOperacion').value;
        if (!numOp) { window.mostrarNotificacion("⚠️ Ingrese el número de operación", 'error'); return; }
        const inputComp = document.getElementById('inputComprobante');
        if(inputComp) compId = inputComp.value;
        const inputExt = document.getElementById('txtComprobanteYape');
        if(inputExt) comprobanteExt = inputExt.value.trim();
        
    } else if (tipo === 'TARJETA') {
        const valBanco = document.getElementById('inputBancoTarjeta').value;
        if (!valBanco || valBanco.trim() === "") { window.mostrarNotificacion("⚠️ Selecciona el Banco", 'error'); return; }
        entidadId = valBanco;
        numOp = document.getElementById('numOperacionTarjeta').value;
        if (!numOp) { window.mostrarNotificacion("⚠️ Ingrese el Voucher/Lote", 'error'); return; }
        const inputCompT = document.getElementById('inputComprobanteTarjeta');
        if(inputCompT) compId = inputCompT.value;
        const inputExt = document.getElementById('txtComprobanteTarjeta');
        if(inputExt) comprobanteExt = inputExt.value.trim();
        
    } else if (tipo === 'TRANSFERENCIA') {
        const valBancoTrans = document.getElementById('inputBancoTransferencia').value;
        if (!valBancoTrans || valBancoTrans.trim() === "") { window.mostrarNotificacion("⚠️ Selecciona el Banco", 'error'); return; }
        entidadId = valBancoTrans;
        numOp = document.getElementById('numOperacionTransferencia').value;
        if (!numOp) { window.mostrarNotificacion("⚠️ Ingrese el N° Operación", 'error'); return; }
        titularTransferencia = document.getElementById('nombreTitularTransferencia').value;
        if (!titularTransferencia) { window.mostrarNotificacion("⚠️ Ingrese el nombre del Titular", 'error'); return; }
        const inputCompTrans = document.getElementById('inputComprobanteTransferencia');
        if(inputCompTrans) compId = inputCompTrans.value;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = 'Procesando...';
    btn.disabled = true;

    const inputDoc = document.getElementById('clienteDoc');
    const inputNom = document.getElementById('clienteNombre');
    const clienteDocFinal = inputDoc && inputDoc.value ? inputDoc.value.trim() : "00000000";
    
    // Si es transferencia, usamos el titular como nombre de cliente. Si no, "Público General"
    let clienteNombreFinal = "Publico General";
    if (tipo === 'TRANSFERENCIA' && titularTransferencia) {
        clienteNombreFinal = titularTransferencia.toUpperCase();
    } else if (inputNom && inputNom.value) {
        clienteNombreFinal = inputNom.value.trim();
    }

    // 3. Crear el paquete de datos corregido (eliminado el arrDetalles que rompía todo)
    const payload = {
        usuarioID: parseInt(window.USUARIO_ID),
        tipoComprobanteID: parseInt(compId),
        clienteDoc: clienteDocFinal,
        clienteNombre: clienteNombreFinal,
        detalles: [{ "CategoriaID": categoriaFinal, "Monto": monto }], // <-- ¡CORREGIDO AQUÍ!
        pagos: [{
            "FormaPago": tipo === 'YAPE' ? 'QR' : (tipo === 'TARJETA' ? 'TARJETA' : 'TRANSFERENCIA'),
            "Monto": monto,
            "EntidadID": parseInt(entidadId),
            "NumOperacion": numOp,
            "NombreTitular": tipo === 'TRANSFERENCIA' ? titularTransferencia.toUpperCase() : null
        }],
        comprobanteExterno: comprobanteExt
    };

    try {
        const res = await fetch(`${window.BASE_URL}/ventas/registrar`, {
            method: 'POST', 
            headers: window.getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        
        if (res.ok && (data.Status === 'OK' || data.status === 'OK')) {
            window.mostrarNotificacion(` VENTA EXITOSA\nTicket: ${data.Comprobante || data.comprobante}`);
            form.reset();
            
            // Limpieza general
            const cont = document.getElementById(idContenedorFam);
            if(cont) cont.querySelectorAll('.seleccionado').forEach(el => el.classList.remove('seleccionado'));
            if(inputFam) inputFam.value = "";
            
            // Limpieza específica por pestaña
            if (tipo === 'YAPE') {
                document.getElementById('inputDestino').value = "1";
                document.getElementById('inputComprobante').value = "2";
                document.getElementById('selectorDestino')?.querySelectorAll('.seleccionado').forEach(b => b.classList.remove('seleccionado'));
            } else if (tipo === 'TARJETA') {
                document.getElementById('inputBancoTarjeta').value = "";
                document.getElementById('inputComprobanteTarjeta').value = "2";
                document.getElementById('selectorBancoTarjeta')?.querySelectorAll('.seleccionado').forEach(b => b.classList.remove('seleccionado'));
            } else if (tipo === 'TRANSFERENCIA') {
                document.getElementById('inputBancoTransferencia').value = "";
                document.getElementById('inputComprobanteTransferencia').value = "2";
                document.getElementById('selectorBancoTransferencia')?.querySelectorAll('.seleccionado').forEach(b => b.classList.remove('seleccionado'));
            }
            cargarMetodosPago();
        } else {
            throw new Error(data.Mensaje || data.mensaje || "No se pudo registrar la venta");
        }
    } catch (error) {
        console.error(error);
        window.mostrarNotificacion(` ERROR: ${error.message}`, 'error');
    } finally {
        btn.innerHTML = originalText; 
        btn.disabled = false;
    }
}