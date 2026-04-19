let tipoPendiente = '', conexiones = [], cableTemporal = null, nodoOrigen = null;

// --- MODAL ---
function configurarVariable() {
    tipoPendiente = 'CIRCULO';
    document.getElementById('modalTitle').innerText = "Nueva Variable";
    document.getElementById('seccionVariable').style.display = 'block';
    document.getElementById('seccionCompuerta').style.display = 'none';
    document.getElementById('modalConfig').style.display = 'flex';
}

function configurarCompuerta(tipo) {
    tipoPendiente = tipo;
    document.getElementById('modalTitle').innerText = `Compuerta ${tipo}`;
    document.getElementById('seccionVariable').style.display = 'none';
    document.getElementById('seccionCompuerta').style.display = 'block';
    const inputE = document.getElementById('numEntradas');
    inputE.value = tipo === 'NOT' ? 1 : 2;
    inputE.disabled = (tipo === 'NOT');
    document.getElementById('modalConfig').style.display = 'flex';
}

function cerrarModal() { document.getElementById('modalConfig').style.display = 'none'; }

function confirmarCreacion() {
    const texto = (document.getElementById('tagTextModal').value || 'A').toUpperCase();
    const esSalida = document.getElementById('tipoTerminal').value === 'salida';
    const estado = document.getElementById('estadoInicial').value;
    const numE = parseInt(document.getElementById('numEntradas').value);
    cerrarModal();
    if (tipoPendiente === 'CIRCULO') crearTerminal(texto, esSalida, estado);
    else crearCompuerta(tipoPendiente, numE);
    actualizarSimulacion();
}

// --- CREACIÓN ---
function spawn(div) {
    div.style.left = "150px"; div.style.top = "150px";
    document.getElementById('canvas').appendChild(div);
    hacerArrastrable(div);
}

function crearTerminal(texto, esSalida, estado) {
    const div = document.createElement('div');
    div.id = (esSalida ? 's-' : 'v-') + Date.now();
    div.className = esSalida ? 'compuerta terminal-salida' : 'compuerta variable';
    div.dataset.nombre = texto;
    div.dataset.estado = estado;
    
    div.innerHTML = `<svg viewBox="0 0 100 140" width="60" height="84" style="overflow:visible">
        <circle class="main-body" cx="50" cy="50" r="35" fill="white" stroke="#2c3e50" stroke-width="5"/>
        <text x="50" y="45" font-family="Arial" font-size="24" font-weight="bold" text-anchor="middle" fill="#2c3e50">${texto}</text>
        <text class="res-val" x="50" y="72" font-family="Arial" font-size="22" font-weight="bold" text-anchor="middle" fill="${estado == 1 ? '#27ae60' : '#e74c3c'}">${esSalida ? '' : estado}</text>
        ${esSalida ? `<text class="equation-text" x="50" y="110" font-family="serif" font-size="14" font-style="italic" text-anchor="middle" fill="#2c3e50"></text>` : ''}
        ${esSalida ? 
            `<circle class="magnetic-edge in" data-id="in-1" cx="15" cy="50" r="22" fill="transparent" style="cursor:default"/>` :
            `<circle class="magnetic-edge out" data-id="out-1" cx="85" cy="50" r="22" fill="transparent" style="cursor:default"/>`
        }
    </svg>`;
    spawn(div);
}

function crearCompuerta(tipo, nEnt) {
    const div = document.createElement('div');
    div.className = 'compuerta gate';
    div.id = 'g-' + Date.now();
    div.dataset.tipo = tipo;
    const alto = 50 + Math.max(0, (nEnt - 2) * 20);
    const centroY = alto / 2;
    const color = (tipo === 'NOT') ? "#ff7675" : (tipo.includes('OR') ? "#74b9ff" : "#ffeaa7");
    
    let svg = `<svg viewBox="0 0 100 ${alto}" width="90" height="${alto}" style="overflow:visible">`;
    const gap = alto / (nEnt + 1);
    for (let i = 1; i <= nEnt; i++) {
        let y = i * gap;
        svg += `<line x1="0" y1="${y}" x2="${tipo.includes('OR') ? 22 : 28}" y2="${y}" stroke="black" stroke-width="3"/>
                <circle class="magnetic-edge in" data-id="in-${i}" cx="0" cy="${y}" r="12" fill="transparent" style="cursor:default"/>`;
    }
    svg += `<line x1="${tipo==='NOT'?75:70}" y1="${centroY}" x2="100" y2="${centroY}" stroke="black" stroke-width="3"/>
            <circle class="magnetic-edge out" data-id="out-1" cx="100" cy="${centroY}" r="12" fill="transparent" style="cursor:default"/>`;
    
    const estilo = `fill="${color}" stroke="#2c3e50" stroke-width="3"`;
    if (tipo.includes('AND')) svg += `<path d="M28 5 h22 a${centroY-5} ${centroY-5} 0 0 1 0 ${alto-10} h-22 z" ${estilo}/>`;
    else if (tipo.includes('OR')) svg += `<path d="M15 5 C30 ${centroY/2} 30 ${alto-centroY/2} 15 ${alto-5} C40 ${alto-5} 60 ${alto-10} 85 ${centroY} C60 10 40 5 15 5 Z" ${estilo}/>`;
    else if (tipo === 'NOT') svg += `<path d="M30 5 L70 ${centroY} L30 ${alto-5} Z" ${estilo}/>`;
    if(tipo==='NAND'||tipo==='NOR'||tipo==='NOT') svg += `<circle cx="${tipo==='NOT'?75:73}" cy="${centroY}" r="5" fill="white" stroke="black" stroke-width="2"/>`;
    
    svg += `<text x="48" y="${centroY+4}" font-family="Arial" font-size="9" font-weight="bold" text-anchor="middle">${tipo}</text></svg>`;
    div.innerHTML = svg;
    spawn(div);
}

// --- ARRASTRE ---
function hacerArrastrable(elm) {
    let p1, p2, p3, p4;
    elm.onmousedown = function(e) {
        if (e.target.classList.contains('magnetic-edge')) {
            e.stopPropagation();
            const r = e.target.getBoundingClientRect(), cr = document.getElementById('canvas').getBoundingClientRect();
            nodoOrigen = { id: elm.id, nodeId: e.target.getAttribute('data-id'), x: (r.left+r.width/2)-cr.left, y: (r.top+r.height/2)-cr.top, esOut: e.target.classList.contains('out') };
            cableTemporal = document.createElementNS("http://www.w3.org/2000/svg", "line");
            cableTemporal.setAttribute("stroke", "#ff7675"); cableTemporal.setAttribute("stroke-width", "4");
            document.getElementById('cable-layer').appendChild(cableTemporal);
            return;
        }
        p3 = e.clientX; p4 = e.clientY;
        document.onmousemove = (ev) => {
            p1 = p3 - ev.clientX; p2 = p4 - ev.clientY; p3 = ev.clientX; p4 = ev.clientY;
            elm.style.top = (elm.offsetTop - p2) + "px"; elm.style.left = (elm.offsetLeft - p1) + "px";
            actualizarCables();
        };
        document.onmouseup = () => {
            document.onmousemove = null;
            const tr = document.getElementById('trash').getBoundingClientRect();
            if(p3 > tr.left && p3 < tr.right && p4 > tr.top && p4 < tr.bottom) {
                conexiones = conexiones.filter(c => { if(c.from===elm.id || c.to===elm.id){c.el.remove(); return false;} return true; });
                elm.remove();
                actualizarSimulacion();
            }
        };
    };
}

document.addEventListener('mousemove', (e) => {
    if (!cableTemporal) return;
    const cr = document.getElementById('canvas').getBoundingClientRect();
    cableTemporal.setAttribute("x1", nodoOrigen.x); cableTemporal.setAttribute("y1", nodoOrigen.y);
    cableTemporal.setAttribute("x2", e.clientX-cr.left); cableTemporal.setAttribute("y2", e.clientY-cr.top);
});

document.addEventListener('mouseup', (e) => {
    if (!cableTemporal) return;
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (target && target.classList.contains('magnetic-edge')) {
        const destEl = target.closest('.compuerta'), destEsOut = target.classList.contains('out');
        if (destEl.id !== nodoOrigen.id && destEsOut !== nodoOrigen.esOut) {
            const emisor = nodoOrigen.esOut ? nodoOrigen : { id: destEl.id, nodeId: target.getAttribute('data-id') };
            const receptor = !nodoOrigen.esOut ? nodoOrigen : { id: destEl.id, nodeId: target.getAttribute('data-id') };
            const nuevoCable = cableTemporal;
            nuevoCable.addEventListener('dblclick', () => {
                conexiones = conexiones.filter(c => c.el !== nuevoCable);
                nuevoCable.remove();
                actualizarSimulacion();
            });
            conexiones.push({ from: emisor.id, fromNode: emisor.nodeId, to: receptor.id, toNode: receptor.nodeId, el: nuevoCable });
            actualizarCables();
            actualizarSimulacion();
        } else cableTemporal.remove();
    } else cableTemporal.remove();
    cableTemporal = null;
});

function actualizarCables() {
    const cr = document.getElementById('canvas').getBoundingClientRect();
    conexiones.forEach(c => {
        const f = document.getElementById(c.from), t = document.getElementById(c.to);
        if (f && t) {
            const nF = f.querySelector(`[data-id="${c.fromNode}"]`).getBoundingClientRect(), nT = t.querySelector(`[data-id="${c.toNode}"]`).getBoundingClientRect();
            c.el.setAttribute("x1", (nF.left+nF.width/2)-cr.left); c.el.setAttribute("y1", (nF.top+nF.height/2)-cr.top);
            c.el.setAttribute("x2", (nT.left+nT.width/2)-cr.left); c.el.setAttribute("y2", (nT.top+nT.height/2)-cr.top);
            c.el.setAttribute("stroke", "#55efc4");
        }
    });
}

// --- MOTOR DE ECUACIÓN Y LÓGICA ---
function construirEcuacion(idComponente) {
    const el = document.getElementById(idComponente);
    if (!el) return "?";
    if (el.classList.contains('variable')) return el.dataset.nombre;
    
    // Para la terminal de salida, buscamos qué tiene conectado
    if (el.classList.contains('terminal-salida')) {
        const con = conexiones.find(c => c.to === idComponente || c.from === idComponente);
        if (!con) return "...";
        let otroId = con.from === idComponente ? con.to : con.from;
        return construirEcuacion(otroId);
    }

    const hijos = conexiones.filter(c => c.to === idComponente).map(c => construirEcuacion(c.from));
    if (hijos.length === 0) return "...";
    
    const tipo = el.dataset.tipo;
    if (tipo === 'NOT') return `~(${hijos[0]})`;
    if (tipo === 'AND') return `(${hijos.join('·')})`;
    if (tipo === 'OR') return `(${hijos.join('+')})`;
    if (tipo === 'NAND') return `~(${hijos.join('·')})`;
    if (tipo === 'NOR') return `~(${hijos.join('+')})`;
    return "";
}

function simular(entradas) {
    let estados = {...entradas};
    let comps = Array.from(document.querySelectorAll('.compuerta'));
    
    for (let i = 0; i < 20; i++) {
        comps.forEach(el => {
            if (el.classList.contains('variable')) return;
            
            // Lógica especial para clonar estado en terminales de salida
            if (el.classList.contains('terminal-salida')) {
                const con = conexiones.find(c => c.to === el.id || c.from === el.id);
                if (con) {
                    let otroId = (con.from === el.id) ? con.to : con.from;
                    if (estados[otroId] !== undefined) estados[el.id] = estados[otroId];
                }
                return;
            }

            const señales = conexiones.filter(c => c.to === el.id).map(c => estados[c.from] ?? 0);
            const t = el.dataset.tipo;
            if (t === 'AND') estados[el.id] = (señales.length > 0 && señales.every(v => v === 1)) ? 1 : 0;
            else if (t === 'OR') estados[el.id] = (señales.length > 0 && señales.some(v => v === 1)) ? 1 : 0;
            else if (t === 'NOT') estados[el.id] = (señales.length > 0) ? (señales[0] === 1 ? 0 : 1) : 1;
            else if (t === 'NAND') estados[el.id] = (señales.length > 0 && señales.every(v => v === 1)) ? 0 : 1;
            else if (t === 'NOR') estados[el.id] = (señales.length > 0 && señales.some(v => v === 1)) ? 0 : 1;
        });
    }
    return estados;
}

function actualizarSimulacion() {
    let inputs = {};
    document.querySelectorAll('.variable').forEach(v => {
        inputs[v.id] = parseInt(v.dataset.estado);
        const txtRes = v.querySelector('.res-val');
        if (txtRes) {
            txtRes.textContent = v.dataset.estado;
            txtRes.setAttribute('fill', v.dataset.estado == 1 ? '#27ae60' : '#e74c3c');
        }
    });

    const res = simular(inputs);

    document.querySelectorAll('.terminal-salida').forEach(s => {
        const con = conexiones.find(c => c.to === s.id || c.from === s.id);
        const txtRes = s.querySelector('.res-val');
        const txtEq = s.querySelector('.equation-text');
        
        if (txtRes) {
            if (con) {
                const val = res[s.id] !== undefined ? res[s.id] : 0;
                txtRes.textContent = val;
                txtRes.setAttribute('fill', val == 1 ? '#27ae60' : '#e74c3c');
                txtRes.style.display = "block"; // Forzar visibilidad
            } else {
                txtRes.textContent = "";
            }
        }
        if (txtEq) {
            txtEq.textContent = con ? `${s.dataset.nombre} = ${construirEcuacion(s.id)}` : "";
        }
    });
}

function mostrarTablaVerdad() {
    const todosLosCirculos = Array.from(document.querySelectorAll('.variable'));
    const outs = Array.from(document.querySelectorAll('.terminal-salida'));

    // Agrupamos por nombre (A, B, C, D) para manejar los 9 círculos como 4 variables
    const nombresUnicos = [...new Set(todosLosCirculos.map(v => v.dataset.nombre))].sort();
    const totalVars = nombresUnicos.length;

    if (totalVars === 0 || outs.length === 0) return;

    const h = document.getElementById('table-header');
    const b = document.getElementById('table-body');
    h.innerHTML = ''; b.innerHTML = '';

    // Encabezados
    nombresUnicos.forEach(nom => h.innerHTML += `<th>${nom}</th>`);
    outs.forEach(s => h.innerHTML += `<th>${s.dataset.nombre}</th>`);

    const totalFilas = Math.pow(2, totalVars);

    for (let i = 0; i < totalFilas; i++) {
        const bits = i.toString(2).padStart(totalVars, '0').split('').map(Number);
        let valPrueba = {};
        
        nombresUnicos.forEach((nom, idx) => {
            const circulos = todosLosCirculos.filter(v => v.dataset.nombre === nom);
            circulos.forEach(c => valPrueba[c.id] = bits[idx]);
        });

        const res = simular(valPrueba);
        const tr = document.createElement('tr');

        // Entradas (0 y 1)
        bits.forEach(bit => {
            tr.innerHTML += `<td style="opacity: 0.7">${bit}</td>`;
        });

        // Salidas coloreadas
        outs.forEach(s => {
            const val = res[s.id] !== undefined ? res[s.id] : 0;
            const color = val ? '#2ecc71' : '#e74c3c';
            tr.innerHTML += `<td style="color:${color}; font-weight:bold">${val}</td>`;
        });

        b.appendChild(tr);
    }
    document.getElementById('truth-table-container').style.display = 'block';
}

function actualizarEstadoInhabilitado() {
    const tipo = document.getElementById('tipoTerminal').value;
    document.getElementById('estadoInicial').disabled = (tipo === 'salida');
}