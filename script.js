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
    const x = window.innerWidth < 600 ? 30 : 150;
    const y = window.innerWidth < 600 ? 30 : 150;
    div.style.left = x + "px"; 
    div.style.top = y + "px";
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
            `<circle class="magnetic-edge in" data-id="in-1" cx="15" cy="50" r="22" fill="transparent"/>` :
            `<circle class="magnetic-edge out" data-id="out-1" cx="85" cy="50" r="22" fill="transparent"/>`
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
                <circle class="magnetic-edge in" data-id="in-${i}" cx="0" cy="${y}" r="15" fill="transparent"/>`;
    }
    svg += `<line x1="${tipo==='NOT'?75:70}" y1="${centroY}" x2="100" y2="${centroY}" stroke="black" stroke-width="3"/>
            <circle class="magnetic-edge out" data-id="out-1" cx="100" cy="${centroY}" r="15" fill="transparent"/>`;
    
    const estilo = `fill="${color}" stroke="#2c3e50" stroke-width="3"`;
    if (tipo.includes('AND')) svg += `<path d="M28 5 h22 a${centroY-5} ${centroY-5} 0 0 1 0 ${alto-10} h-22 z" ${estilo}/>`;
    else if (tipo.includes('OR')) svg += `<path d="M15 5 C30 ${centroY/2} 30 ${alto-centroY/2} 15 ${alto-5} C40 ${alto-5} 60 ${alto-10} 85 ${centroY} C60 10 40 5 15 5 Z" ${estilo}/>`;
    else if (tipo === 'NOT') svg += `<path d="M30 5 L70 ${centroY} L30 ${alto-5} Z" ${estilo}/>`;
    if(tipo==='NAND'||tipo==='NOR'||tipo==='NOT') svg += `<circle cx="${tipo==='NOT'?75:73}" cy="${centroY}" r="5" fill="white" stroke="black" stroke-width="2"/>`;
    
    svg += `<text x="48" y="${centroY+4}" font-family="Arial" font-size="9" font-weight="bold" text-anchor="middle">${tipo}</text></svg>`;
    div.innerHTML = svg;
    spawn(div);
}

// --- ARRASTRE Y EVENTOS ---
function hacerArrastrable(elm) {
    let p1, p2, p3, p4;

    const iniciarArrastre = (e) => {
        const clienteX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clienteY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

        if (e.target.classList.contains('magnetic-edge')) {
            if (e.type.includes('mouse')) e.stopPropagation(); 
            const r = e.target.getBoundingClientRect(), cr = document.getElementById('canvas').getBoundingClientRect();
            
            nodoOrigen = { 
                id: elm.id, 
                nodeId: e.target.getAttribute('data-id'), 
                x: (r.left + r.width / 2) - cr.left, 
                y: (r.top + r.height / 2) - cr.top, 
                esOut: e.target.classList.contains('out') 
            };
            
            cableTemporal = document.createElementNS("http://www.w3.org/2000/svg", "line");
            cableTemporal.setAttribute("stroke", "#ff7675"); 
            cableTemporal.setAttribute("stroke-width", "4");
            document.getElementById('cable-layer').appendChild(cableTemporal);
            return;
        }

        p3 = clienteX; 
        p4 = clienteY;

        const mover = (ev) => {
            const movX = ev.type.includes('touch') ? ev.touches[0].clientX : ev.clientX;
            const movY = ev.type.includes('touch') ? ev.touches[0].clientY : ev.clientY;
            p1 = p3 - movX; p2 = p4 - movY; p3 = movX; p4 = movY;
            elm.style.top = (elm.offsetTop - p2) + "px"; 
            elm.style.left = (elm.offsetLeft - p1) + "px";
            actualizarCables();
        };

        const detener = () => {
            document.onmousemove = document.ontouchmove = null;
            document.onmouseup = document.ontouchend = null;
            const tr = document.getElementById('trash').getBoundingClientRect();
            if(p3 > tr.left && p3 < tr.right && p4 > tr.top && p4 < tr.bottom) {
                conexiones = conexiones.filter(c => { 
                    if(c.from === elm.id || c.to === elm.id){ c.el.remove(); return false; } 
                    return true; 
                });
                elm.remove();
                actualizarSimulacion();
            }
        };
        document.onmousemove = document.ontouchmove = mover;
        document.onmouseup = document.ontouchend = detener;
    };
    elm.onmousedown = elm.ontouchstart = iniciarArrastre;
}

// --- LOGICA DE CABLES ---
const moverCable = (e) => {
    if (!cableTemporal) return;
    const cr = document.getElementById('canvas').getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - cr.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - cr.top;
    cableTemporal.setAttribute("x1", nodoOrigen.x);
    cableTemporal.setAttribute("y1", nodoOrigen.y);
    cableTemporal.setAttribute("x2", x);
    cableTemporal.setAttribute("y2", y);
    if(e.touches) e.preventDefault();
};

const soltarCable = (e) => {
    if (!cableTemporal) return;
    const cX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const cY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    
    cableTemporal.style.display = 'none';
    const target = document.elementFromPoint(cX, cY);
    cableTemporal.style.display = 'block';
    
    if (target && target.classList.contains('magnetic-edge')) {
        const destEl = target.closest('.compuerta'), destEsOut = target.classList.contains('out');
        if (destEl.id !== nodoOrigen.id && destEsOut !== nodoOrigen.esOut) {
            const emisor = nodoOrigen.esOut ? nodoOrigen : { id: destEl.id, nodeId: target.getAttribute('data-id') };
            const receptor = !nodoOrigen.esOut ? nodoOrigen : { id: destEl.id, nodeId: target.getAttribute('data-id') };
            const nuevoCable = cableTemporal;
            nuevoCable.setAttribute("stroke", "#55efc4");
            
            const borrar = () => { conexiones = conexiones.filter(c => c.el !== nuevoCable); nuevoCable.remove(); actualizarSimulacion(); };
            nuevoCable.addEventListener('dblclick', borrar);
            nuevoCable.addEventListener('touchstart', (ev) => {
                if (!nuevoCable.lC) { nuevoCable.lC = Date.now(); return; }
                if (Date.now() - nuevoCable.lC < 300) borrar();
                nuevoCable.lC = Date.now();
            });

            conexiones.push({ from: emisor.id, fromNode: emisor.nodeId, to: receptor.id, toNode: receptor.nodeId, el: nuevoCable });
            actualizarCables(); actualizarSimulacion();
        } else cableTemporal.remove();
    } else cableTemporal.remove();
    cableTemporal = null;
};

document.addEventListener('mousemove', moverCable);
document.addEventListener('touchmove', moverCable, { passive: false });
document.addEventListener('mouseup', soltarCable);
document.addEventListener('touchend', soltarCable);

function actualizarCables() {
    const cr = document.getElementById('canvas').getBoundingClientRect();
    conexiones.forEach(c => {
        const f = document.getElementById(c.from), t = document.getElementById(c.to);
        if (f && t) {
            const nF = f.querySelector(`[data-id="${c.fromNode}"]`).getBoundingClientRect();
            const nT = t.querySelector(`[data-id="${c.toNode}"]`).getBoundingClientRect();
            c.el.setAttribute("x1", (nF.left + nF.width/2)-cr.left); c.el.setAttribute("y1", (nF.top + nF.height/2)-cr.top);
            c.el.setAttribute("x2", (nT.left + nT.width/2)-cr.left); c.el.setAttribute("y2", (nT.top + nT.height/2)-cr.top);
        }
    });
}

// --- LÓGICA DE SIMULACIÓN ---
function construirEcuacion(idComp) {
    const el = document.getElementById(idComp);
    if (!el) return "?";
    if (el.classList.contains('variable')) return el.dataset.nombre;
    if (el.classList.contains('terminal-salida')) {
        const con = conexiones.find(c => c.to === idComp || c.from === idComp);
        return con ? construirEcuacion(con.from === idComp ? con.to : con.from) : "...";
    }
    const hijos = conexiones.filter(c => c.to === idComp).map(c => construirEcuacion(c.from));
    if (hijos.length === 0) return "...";
    const t = el.dataset.tipo;
    if (t === 'NOT') return `~(${hijos[0]})`;
    if (t === 'AND') return `(${hijos.join('·')})`;
    if (t === 'OR') return `(${hijos.join('+')})`;
    if (t === 'NAND') return `~(${hijos.join('·')})`;
    if (t === 'NOR') return `~(${hijos.join('+')})`;
    return "";
}

function simular(entradas) {
    let estados = {...entradas}, comps = Array.from(document.querySelectorAll('.compuerta'));
    for (let i = 0; i < 20; i++) {
        comps.forEach(el => {
            if (el.classList.contains('variable')) return;
            if (el.classList.contains('terminal-salida')) {
                const con = conexiones.find(c => c.to === el.id || c.from === el.id);
                if (con) {
                    let otro = (con.from === el.id) ? con.to : con.from;
                    if (estados[otro] !== undefined) estados[el.id] = estados[otro];
                }
                return;
            }
            const s = conexiones.filter(c => c.to === el.id).map(c => estados[c.from] ?? 0);
            const t = el.dataset.tipo;
            if (t === 'AND') estados[el.id] = (s.length > 0 && s.every(v => v === 1)) ? 1 : 0;
            else if (t === 'OR') estados[el.id] = (s.length > 0 && s.some(v => v === 1)) ? 1 : 0;
            else if (t === 'NOT') estados[el.id] = (s.length > 0) ? (s[0] === 1 ? 0 : 1) : 1;
            else if (t === 'NAND') estados[el.id] = (s.length > 0 && s.every(v => v === 1)) ? 0 : 1;
            else if (t === 'NOR') estados[el.id] = (s.length > 0 && s.some(v => v === 1)) ? 0 : 1;
        });
    }
    return estados;
}

function actualizarSimulacion() {
    let inputs = {};
    document.querySelectorAll('.variable').forEach(v => {
        inputs[v.id] = parseInt(v.dataset.estado);
        const tr = v.querySelector('.res-val');
        if (tr) { tr.textContent = v.dataset.estado; tr.setAttribute('fill', v.dataset.estado == 1 ? '#27ae60' : '#e74c3c'); }
    });
    const res = simular(inputs);
    document.querySelectorAll('.terminal-salida').forEach(s => {
        const tr = s.querySelector('.res-val'), te = s.querySelector('.equation-text'), con = conexiones.find(c => c.to === s.id || c.from === s.id);
        if (tr) { 
            const val = res[s.id] ?? 0;
            tr.textContent = con ? val : "";
            tr.setAttribute('fill', val == 1 ? '#27ae60' : '#e74c3c');
        }
        if (te) te.textContent = con ? `${s.dataset.nombre} = ${construirEcuacion(s.id)}` : "";
    });
}

function mostrarTablaVerdad() {
    const vars = Array.from(document.querySelectorAll('.variable')), outs = Array.from(document.querySelectorAll('.terminal-salida'));
    const nombres = [...new Set(vars.map(v => v.dataset.nombre))].sort();
    if (nombres.length === 0 || outs.length === 0) return;
    const h = document.getElementById('table-header'), b = document.getElementById('table-body');
    h.innerHTML = ''; b.innerHTML = '';
    nombres.forEach(n => h.innerHTML += `<th>${n}</th>`);
    outs.forEach(o => h.innerHTML += `<th>${o.dataset.nombre}</th>`);
    const filas = Math.pow(2, nombres.length);
    for (let i = 0; i < filas; i++) {
        const bits = i.toString(2).padStart(nombres.length, '0').split('').map(Number);
        let p = {};
        nombres.forEach((n, idx) => { vars.filter(v => v.dataset.nombre === n).forEach(c => p[c.id] = bits[idx]); });
        const r = simular(p), tr = document.createElement('tr');
        bits.forEach(bit => tr.innerHTML += `<td>${bit}</td>`);
        outs.forEach(o => { const val = r[o.id] ?? 0; tr.innerHTML += `<td style="color:${val?'#2ecc71':'#e74c3c'};font-weight:bold">${val}</td>`; });
        b.appendChild(tr);
    }
    document.getElementById('truth-table-container').style.display = 'block';
}

function actualizarEstadoInhabilitado() {
    document.getElementById('estadoInicial').disabled = (document.getElementById('tipoTerminal').value === 'salida');
}