let fotosVisita=[]; window.fotosVisita=fotosVisita;
let impresoraSeleccionada=null; window._impresorasTemp=[]; let cacheImp=null;
let cacheUsuarios=null; let cacheUsuariosLista=[];
let LOGO_BASE64=null;

// ====== VARIABLES DE FIRMA - UNA SOLA VEZ ARRIBA ======
let firmaDibujada = false;
let firmaDataURL = null;
let firmaBase64 = null;
let ctxFirma = null;

function getKeyVisitas(usuario, clienteCodigo){
  const u = String(usuario||getUsuarioActual()||'').trim().toUpperCase();
  // Solo el código, sin nombre, sin espacios, en mayúsculas
  const c = String(clienteCodigo||document.getElementById('vCliente')?.value||'').split('-')[0].trim().toUpperCase();
  return 'ecoloimp_visitas_'+u+'_'+c;
}

function norm(s){ return String(s||'').trim().toUpperCase(); }

async function cargarLogo(){
  if(LOGO_BASE64) return LOGO_BASE64;
  const urls=['./img/logo.png'];
  for(let url of urls){
    try{
      const r=await fetch(url+'?v='+Date.now()); if(!r.ok) continue;
      const blob=await r.blob();
      const b64=await new Promise(res=>{
        const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.readAsDataURL(blob);
      });
      LOGO_BASE64=b64;
      localStorage.setItem('ecoloimp_logo_base64', b64);
      return b64;
    }catch(e){}
  }
  try{ const loc=localStorage.getItem('ecoloimp_logo_base64'); if(loc){LOGO_BASE64=loc; return loc;} }catch(e){}
  return null;
}
async function cargarUsuariosTxt(){
  if(cacheUsuarios) return cacheUsuarios;
  try{
    const r=await fetch('./data/usuarios.txt?v='+Date.now()); const txt=await r.text();
    const map={}; const lista=[];
    txt.split('\n').forEach(line=>{
      line=line.trim(); if(!line||line.startsWith('#')) return;
      const p=line.split(';').map(x=>x.trim());
      if(p.length>=3){ map[p[0].toUpperCase()]=p[2]; lista.push({usuario:p[0], password:p[1], nombre:p[2], tipo:p[3], tecnico:p[4]}); }
    });
    cacheUsuarios=map; cacheUsuariosLista=lista;
    localStorage.setItem('ecoloimp_usuarios_map', JSON.stringify(map));
    localStorage.setItem('ecoloimp_usuarios_lista', JSON.stringify(lista));
    return map;
  }catch(e){ return {}; }
}
function getUsuarioActual(){ const h=document.getElementById('uUsuario')?.innerText?.trim(); if(h&&h.length>1) return h.toUpperCase(); return (localStorage.getItem('ecoloimp_usuario')||'ARUGEL').toUpperCase(); }
function getNombreUsuario(){ const u=getUsuarioActual(); if(cacheUsuarios&&cacheUsuarios[u]) return cacheUsuarios[u]; try{ const m=JSON.parse(localStorage.getItem('ecoloimp_usuarios_map')||'{}'); if(m[u]) return m[u]; }catch(e){} return document.getElementById('uName')?.innerText?.trim()||u; }
function getDatosUsuarioCompleto(){ const u=getUsuarioActual(); try{ const lista=cacheUsuariosLista.length?cacheUsuariosLista:JSON.parse(localStorage.getItem('ecoloimp_usuarios_lista')||'[]'); const enc=lista.find(x=>String(x.usuario).toUpperCase()===u); if(enc) return enc; }catch(e){} return {usuario:u, nombre:getNombreUsuario()}; }

function cargarTrabajosVisita(){
  const sel = $("vtTrabajo");
  if(!sel || !DB.trabajos) return;
  sel.innerHTML = `<option value="">-- Seleccione trabajo --</option>` + 
    DB.trabajos.map(tr=> `<option value="${esc(tr.codigo)}">${esc(tr.codigo)} - ${esc(tr.nombre)}</option>`).join("");
  // Deja en vacío para que obligue a elegir
  sel.value = "";
}

function codigoClienteActual(){
  return (document.getElementById('vCliente')?.value||'').split('-')[0].trim().toUpperCase();
}

function getClienteActual(){ 
  const sel = document.getElementById('vCliente'); 
  if(!sel) return null;
  return { id: sel.value, codigo: sel.value, nombre: sel.options[sel.selectedIndex]?.text || sel.value };
}

function obtenerCodigoYNombre(){
  const c = getClienteActual();
  if(window.DB?.clientes){
    const f = DB.clientes.find(x => x.id === c.id);
    if(f) c.nombre = f.nombre;
  }
  return {codigo:c.id, nombre:c.nombre};
}

function selectedClientVisita(){ 
  return DB.clientes.find(c=>c.codigo===$("vCliente")?.value); 
}

function getTodasImpresoras(){
  if(window.DB && window.DB.impresoras && window.DB.impresoras.length > 0) return window.DB.impresoras;
  try{ return JSON.parse(localStorage.getItem('ecoloimp_impresoras') || '[]'); }catch(e){ return []; }
}

async function cargaDirecta(){ 
  for(let url of ['./data/impresoras.txt','data/impresoras.txt']){
    try{ 
      const r=await fetch(url+'?v='+Date.now()); 
      if(!r.ok) continue; 
      const txt=await r.text(); 
      const lista=txt.split('\n').map(s=>s.trim()).filter(s=>s&&!s.startsWith('#')).map(l=>{ 
        const p=l.split(';').map(x=>x.trim());
        // tu archivo real es: CLIENTE;CODIGO;MODELO;SERIE;SUCURSAL;AREA;UBICACION;IP;BODEGA
        // lo dejamos a prueba de filas cortas
        return {cliente:p[0]||'',codigo:p[1]||'',modelo:p[2]||'',serie:p[3]||'',sucursal:p[4]||'',area:p[5]||'',ubicacion:p[6]||'',bodega:p[7]||''}; 
      }).filter(x=>x.cliente&&x.serie); 
      if(lista.length){ 
        // NO BORRAR DB, solo agregar impresoras
        window.DB = window.DB || {};
        window.DB.impresoras = lista; 
        cacheImp=lista; 
        localStorage.setItem('ecoloimp_impresoras', JSON.stringify(lista));
        return lista; 
      } 
    }catch(e){}
  } 
  return [];
}

async function filtrarImpresorasCliente(){
  
  const sel = document.getElementById('vCliente');
  const cliente = codigoClienteActual();

const todas1 = JSON.parse(localStorage.getItem('ecoloimp_impresoras')||'[]');
console.log('TOTAL:', todas1.length);
console.log('VAL SELECT:', document.getElementById('vCliente')?.value);
console.log('CODIGO ACTUAL:', codigoClienteActual());
console.log('PRIMEROS 5:', todas1.slice(0,5));
console.log('CLIENTES ÚNICOS:', [...new Set(todas1.map(i=>i.cliente))].slice(0,20));
console.log('CÓDIGOS ÚNICOS:', [...new Set(todas1.map(i=>i.codigo))].slice(0,20));




  if(typeof mostrarListaVisitasSesion === 'function') mostrarListaVisitasSesion();
  const cont = document.getElementById('listaImpresoras');

  // UN SOLO DETECTOR
  const ancho = window.innerWidth;

  const esPorUserAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const esCelular = esPorUserAgent || ancho <= 768;

  // Debug visible en pantalla, no alert
  const debug = document.getElementById('debugDispositivo');
  if(debug) debug.innerHTML = 'Estás en: <b>' + (esCelular ? '📱 CELULAR' : '💻 PC') + '</b> - Ancho: ' + ancho + 'px';

  const elMsg = document.getElementById("vMessage");
  if(elMsg){ elMsg.style.color = 'Estás en: <b>' + (esCelular ? '📱 CELULAR' : '💻 PC') + '</b> - Ancho: ' + ancho + 'px';}

  const val = sel?.value?.trim();
  if(!val || val.toLowerCase().includes('seleccione') || val === ""){
    if(cont) cont.innerHTML = '<div style="padding:20px;text-align:center;color:#64748b;border:1.5px dashed #cbd5e1;border-radius:14px">👆 Selecciona un cliente</div>';
    const d1 = document.getElementById('datosImpresoraSeleccionada'); if(d1) d1.innerHTML = '';
    const d2 = document.getElementById('formDatosVisita'); if(d2) d2.innerHTML = '';
    return;
  }

  //const cliente = val.split('-')[0].trim().toUpperCase();
  if(cont) cont.innerHTML = '<div style="padding:15px;text-align:center">⏳ Cargando impresoras de '+cliente+'...</div>';

  // 1. INTENTAR DESDE DB
  let todas = [];
  try{ todas = getTodasImpresoras() || []; }catch(e){ todas = []; }

  // 2. SI ESTA VACIO EN CELULAR, DESDE LOCALSTORAGE
  if(todas.length === 0){
    try{ todas = JSON.parse(localStorage.getItem('ecoloimp_impresoras') || '[]'); }catch(e){ todas = []; }
  }

  // 3. SI SIGUE VACIO, LEER EL TXT DIRECTO - ESTO ES LO QUE FALTABA EN CELULAR
  if(todas.length === 0){
    try{
      const urls = ['data/impresoras.txt?v='+Date.now(), './data/impresoras.txt?v='+Date.now(), '/data/impresoras.txt?v='+Date.now()];
      let txt = '';
      for(const u of urls){
        try{
          const r = await fetch(u);
          if(r.ok){ txt = await r.text(); break; }
        }catch(e){}
      }
      if(txt){
        txt = txt.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        todas = txt.split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#')).map(l => {
          const p = l.split(';').map(x => x.trim());
          return { cliente: p[0], codigo: p[1], modelo: p[2], serie: p[3] || p[1], sucursal: p[4], area: p[5], ubicacion: p[6], bodega: p[7] };
        }).filter(x => x.cliente && x.serie);
        // Guardar para la próxima vez
        localStorage.setItem('ecoloimp_impresoras', JSON.stringify(todas));
        if(window.DB) window.DB.impresoras = todas;
      }
    }catch(e){ console.log('Error leyendo txt directo', e); }
  }

  console.log('Cliente:', cliente, 'Total cargado:', todas.length, 'Ejemplo:', todas[0]);

  const norm = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const clienteNorm = norm(cliente);

  window._impresorasTemp = todas.filter(i =>
    norm(i.cliente) === clienteNorm ||
    norm(i.cliente).includes(clienteNorm) ||
    norm(i.codigo) === clienteNorm
  );

  if(window._impresorasTemp.length === 0){
    if(cont) cont.innerHTML = '<div style="padding:20px;text-align:center;color:#ef4444;border:1.5px dashed #fecaca;border-radius:14px">❌ No hay impresoras para '+cliente+'<br><small>Total en base: '+todas.length+'<br>Primer cliente en base: '+(todas[0]?.cliente || 'NADA')+'</small></div>';
    return;
  }

  const usuario = typeof getUsuarioActual === 'function' ? getUsuarioActual() : 'ADMIN';
  let visitas = [];
  try{ visitas = JSON.parse(localStorage.getItem(getKeyVisitas(usuario, cliente)) || '[]'); }catch(e){ visitas = []; }
  const hechas = new Set(visitas.map(v => String(v.serie || '').toUpperCase()));

  // CELULAR: TARJETAS   // ===== CELULAR: SOLO ACCION | MODELO | SERIE =====
// CELULAR: TABLA COMPLETA CON SCROLL HORIZONTAL Y CABECERA FIJA
if(esCelular){
  let html = `
  <div style="margin-top:12px;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;background:#fff">
    <div style="font-weight:800;font-size:13px;padding:10px 12px;background:#f0fdf4;color:#15803d">🖨️ ${window._impresorasTemp.length} impresoras - ${cliente} <span style="font-weight:400;font-size:11px;color:#64748b">👉 Desliza → para ver más</span></div>
    <div style="overflow-x:auto;-webkit-overflow-scrolling:touch">
      <table style="width:100%;border-collapse:collapse;font-size:13px;min-width:720px">
        <thead style="position:sticky;top:0;z-index:2">
          <tr>
            <th style="background:#18A957;color:#fff;padding:10px 8px;text-align:left;font-size:11px;font-weight:800;white-space:nowrap;position:sticky;top:0">ACCIÓN</th>
            <th style="background:#18A957;color:#fff;padding:10px 8px;text-align:left;font-size:11px;font-weight:800;white-space:nowrap;position:sticky;top:0">MODELO</th>
            <th style="background:#18A957;color:#fff;padding:10px 8px;text-align:left;font-size:11px;font-weight:800;white-space:nowrap;position:sticky;top:0">SERIE</th>
            <th style="background:#18A957;color:#fff;padding:10px 8px;text-align:left;font-size:11px;font-weight:800;white-space:nowrap;position:sticky;top:0">SUCURSAL</th>
            <th style="background:#18A957;color:#fff;padding:10px 8px;text-align:left;font-size:11px;font-weight:800;white-space:nowrap;position:sticky;top:0">AREA</th>
            <th style="background:#18A957;color:#fff;padding:10px 8px;text-align:left;font-size:11px;font-weight:800;white-space:nowrap;position:sticky;top:0">UBICACION</th>
            <th style="background:#18A957;color:#fff;padding:10px 8px;text-align:left;font-size:11px;font-weight:800;white-space:nowrap;position:sticky;top:0">BOD</th>
          </tr>
        </thead>
        <tbody>`;

  window._impresorasTemp.forEach(imp => {
    const isHecha = hechas.has(String(imp.serie).toUpperCase());
    html += `
      <tr style="border-bottom:1px solid #f1f5f9">
        <td style="padding:8px;white-space:nowrap"><button onclick="seleccionarImpresora('${imp.serie}')" ${isHecha ? 'disabled' : ''} style="background:${isHecha ? '#dcfce7' : '#18A957'};color:${isHecha ? '#15803d' : '#fff'};border:0;border-radius:8px;padding:7px 10px;font-size:11px;font-weight:800;white-space:nowrap">${isHecha ? '✅ Hecha' : '🔍'}</button></td>
        <td style="padding:8px">${imp.modelo || ''}</td>
        <td style="padding:8px;font-weight:800;white-space:nowrap">${imp.serie}</td>
        <td style="padding:8px">${imp.sucursal || ''}</td>
        <td style="padding:8px">${imp.area || ''}</td>
        <td style="padding:8px">${imp.ubicacion || ''}</td>
        <td style="padding:8px">${imp.bodega || ''}</td>
      </tr>`;
  });

  html += `</tbody></table></div></div>`;
  if(cont) cont.innerHTML = html;
  return;
}
  // PC: TABLA (tu código original)
  let html = `
  <div style="margin-top:12px;border:1px solid #e2e8f0;border-radius:14px;overflow:auto;max-height:420px;background:#fff"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead style="position:sticky;top:0;background:#18A957;color:#fff">
  <tr>
    <th style="background:#18A957;color:#fff;padding:12px 10px;text-align:left">ACCIÓN</th>
    <th style="background:#18A957;color:#fff;padding:12px 10px;text-align:left">CÓDIGO</th>
    <th style="background:#18A957;color:#fff;padding:12px 10px;text-align:left">MODELO</th>
    <th style="background:#18A957;color:#fff;padding:12px 10px;text-align:left">SERIE</th>
    <th style="background:#18A957;color:#fff;padding:12px 10px;text-align:left">SUCURSAL</th>
    <th style="background:#18A957;color:#fff;padding:12px 10px;text-align:left">AREA</th>
    <th style="background:#18A957;color:#fff;padding:12px 10px;text-align:left">UBICACION</th>
    <th style="background:#18A957;color:#fff;padding:12px 10px;text-align:left">BOD</th>
  </tr>
  </thead>
  <tbody>`;
  window._impresorasTemp.forEach(imp => {
    const isHecha = hechas.has(String(imp.serie).toUpperCase());
    html += `
    <tr style="border-bottom:1px solid #f1f5f9">
      <td style="padding:8px"><button onclick="seleccionarImpresora('${imp.serie}')" style="background:${isHecha ? '#dcfce7' : '#18A957'};color:${isHecha ? '#15803d' : '#fff'};border:0;border-radius:8px;padding:6px 12px" ${isHecha ? 'disabled' : ''}>${isHecha ? '✅ Hecha' : '🔍 Seleccionar'}</button></td>
      <td style="padding:8px">${imp.codigo}</td>
      <td style="padding:8px">${imp.modelo}</td>
      <td style="padding:8px;font-weight:800">${imp.serie}</td>
      <td style="padding:8px">${imp.sucursal}</td>
      <td style="padding:8px">${imp.area}</td>
      <td style="padding:8px">${imp.ubicacion}</td>
      <td style="padding:8px">${imp.bodega}</td>
  </tr>
    `;
  });
  html += `</tbody></table></div>`;
  cont.innerHTML = html;
}

function seleccionarImpresora(serie){ 
  document.querySelectorAll('[id^="fila-"]').forEach(r=>r.classList.remove('fila-sel'));
  document.getElementById('fila-'+serie)?.classList.add('fila-sel');  
  
    const imp = window._impresorasTemp.find(x=>String(x.serie).toUpperCase()===String(serie).toUpperCase()); 
    if(!imp) return; 
    impresoraSeleccionada = imp; 

    mostrarFormularioVisita(); 

    setTimeout(()=>{
      const cont = document.getElementById('datosImpresoraSeleccionada');
      if(!cont){ alert('No existe el div datosImpresoraSeleccionada'); return; }

      const cli = getClienteActual(); // cliente actual C665 etc.

      cont.innerHTML = `
  <div style="margin-top:8px;background:#73D17D;border-radius:10px;padding:10px;text-align:left">
    <b>🖨️ Datos de la impresora seleccionada </b> 
  </div>
  <div style="margin-top:12px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:12px;display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
    <div><small style="display:block;color:#64748b;font-size:11px">Código</small><strong>${esc(imp.codigo)}</strong></div>
    <div><small style="display:block;color:#64748b;font-size:11px">Modelo</small><strong>${esc(imp.modelo)}</strong></div>
    <div><small style="display:block;color:#64748b;font-size:11px">Serie</small><strong>${esc(imp.serie)}</strong></div>
    <div><small style="display:block;color:#64748b;font-size:11px">Sucursal</small><strong>${esc(imp.sucursal || imp.sede)}</strong></div>
    <div><small style="display:block;color:#64748b;font-size:11px">Área</small><strong>${esc(imp.area)}</strong></div>
    <div><small style="display:block;color:#64748b;font-size:11px">Ubicación</small><strong>${esc(imp.ubicacion || imp.area)}</strong></div>
    <div><small style="display:block;color:#64748b;font-size:11px">Bodega / IP</small><strong>${esc(imp.bodega || imp.ip)}</strong></div>
    <div><small style="display:block;color:#64748b;font-size:11px">Cliente</small><strong>${esc(cli ? cli.nombre : imp.cliente)}</strong></div>
  </div>
`;

      cont.scrollIntoView({behavior:'smooth'});
    }, 150);  
}

window.filtrarImpresorasCliente = filtrarImpresorasCliente;
window.seleccionarImpresora = seleccionarImpresora;

//document.addEventListener('DOMContentLoaded', ()=>{
//  const sel = document.getElementById('vCliente');
//  if(sel) sel.addEventListener('change', filtrarImpresorasCliente);
//});

async function mostrarFormularioVisita(){
  const esCelular = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth <= 768;
  const cols = esCelular ? '1fr' : '1fr 1fr';

  const hoy=new Date().toISOString().split('T')[0]; 
  const ahora=new Date().toTimeString().slice(0,5); 

  const tecRaw = (DB.tecnicos || []).map(t => {
  const cod = (t.codigo || '').toString().trim();
  const nom = (t.nombre || '').trim();
  return `${cod};${nom}`;
  });

  const tecOptions = tecRaw.map(l => {
  const p = l.split(';');
  const cod = (p[0]||'').trim();
  const nom = (p[1]||p[0]||'').trim();
  return `<option value="${cod}">${cod} - ${nom}</option>`;
  }).join('');



  const trabRaw = (DB.trabajos || []).map(t => {
  const cod = (t.codigo || '').toString().trim();
  const nom = (t.nombre || '').trim();
  return `${cod};${nom}`;
  });

  const trabOptions = trabRaw.map(l => {
    const p = l.split(';');
    const cod = (p[0]||'').trim();
    const nom = (p[1]||p[0]||'').trim();
    return `<option value="${cod}">${cod} - ${nom}</option>`;
  }).join('');

  document.getElementById('formDatosVisita').innerHTML=`
  <div style="margin-top:12px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;width:100%;max-width:100%;box-sizing:border-box;overflow:hidden">    <div style="padding:14px;background:#73D17D;display:flex;justify-content:space-between;align-items:center"><b>📑INGRESO DE DATOS VISITA TECNICA visitas</b></div>
      <div style="display:grid;grid-template-columns:${cols};gap:10px">
            <div style="display:flex;flex-direction:column">
              <label style="font-size:11px;font-weight:700;color:#0f172a;margin-bottom:4px">FECHA</label>
              <input id="vFecha" type="date" value="${hoy}" style="padding:8px;border:1px solid #e2e8f0;border-radius:8px">
            </div>            
            <div style="display:flex;flex-direction:column">
              <label style="font-size:11px;font-weight:700;color:#0f172a;margin-bottom:4px">HORA</label>
              <input id="vHora" type="time" value="${ahora}" style="padding:8px;border:1px solid #e2e8f0;border-radius:8px">
            </div>
            <div style="display:flex;flex-direction:column">
              <label style="font-size:11px;font-weight:700;color:#0f172a;margin-bottom:4px">TÉCNICO</label>
              <select id="vTecnico" style="padding:8px;border-radius:8px;border:1px solid #e2e8f0">
                 <option value="">Seleccione técnico</option>
                 ${tecOptions}
              </select>
            </div>
            <div style="display:flex;flex-direction:column">
              <label style="font-size:11px;font-weight:700;color:#0f172a;margin-bottom:4px">TRABAJO REALIZADO</label>
              <select id="vTrabajo" style="padding:8px;border-radius:8px;border:1px solid #e2e8f0">
                <option value="">Seleccione trabajo</option>
                  ${trabOptions}
              </select>            
            </div>
            <div style="display:flex;flex-direction:column">
              <label style="font-size:11px;font-weight:700;color:#0f172a;margin-bottom:4px">TIPO DE VISITA</label>
              <select id="vTipo" style="padding:8px;border-radius:8px;border:1px solid #e2e8f0"><option>Preventiva</option><option>Correctiva</option></select>
            </div>
            <div style="display:flex;flex-direction:column">
              <label style="font-size:11px;font-weight:700;color:#0f172a;margin-bottom:4px">ESTADO</label>
              <select id="vEstado" style="padding:8px;border-radius:8px;border:1px solid #e2e8f0"><option>Finalizada</option><option>Pendiente</option></select>
            </div>
            <div style="display:flex;flex-direction:column;grid-column:1/-1">
              <label style="font-size:11px;font-weight:700;color:#0f172a;margin-bottom:4px">CONTADOR *</label>
              <input id="vContador" type="number" placeholder="Ingrese contador" style="padding:8px;border:1.5px solid #22c55e;border-radius:8px;background:#f0fdf4;font-weight:800">
            </div>
            <div style="display:flex;flex-direction:column;grid-column:1/-1">
              <label style="font-size:11px;font-weight:700;color:#0f172a;margin-bottom:4px">DETALLE DEL TRABAJO</label>
              <textarea id="vObs" rows="8" style="padding:10px;border-radius:8px;border:1px solid #e2e8f0;min-height:140px" placeholder="Escriba el detalle (8 líneas)"></textarea>
            </div>
          </div>


        <div style="margin-top:10px;display:flex;gap:8px">
            <input id="inputCamara" type="file" accept="image/*" capture="environment" style="display:none" onchange="procesarFotos(this.files)">
            <input id="inputGaleria" type="file" accept="image/*" multiple style="display:none" onchange="procesarFotos(this.files)">
            <button onclick="document.getElementById('inputCamara').click()" type="button" style="background:#0f172a;color:#fff;border-radius:8px;padding:8px 14px">📸 CÁMARA</button>
            <button onclick="document.getElementById('inputGaleria').click()" type="button" style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:8px 14px">🖼️ GALERÍA</button>
            <button onclick="guardarVisita()" type="button" style="background:#22c55e;color:#000;border-radius:8px;padding:8px 16px;font-weight:800;margin-left:auto">💾 GUARDAR VISITA</button>
        </div>
        <div id="previewFotos" style="margin-top:10px"></div>
    </div>`;
  setTimeout(iniciarFirma,120);
}

function procesarFotos(files){
  Array.from(files||[]).slice(0,5).forEach(f=>{
    const img = new Image();
    const url = URL.createObjectURL(f);
    img.onload = ()=>{
      // Comprime a máximo 800px de ancho
      const max = 800;
      let w = img.width, h = img.height;
      if(w > max){ h = h * max / w; w = max; }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      // JPEG calidad 0.6 = 90% más liviano
      const comprimida = canvas.toDataURL('image/jpeg', 0.6);
      window.fotosVisita.push(comprimida);
      renderPreview();
      URL.revokeObjectURL(url);
      console.log('Foto original:', f.size, 'Comprimida:', comprimida.length);
    };
    img.src = url;
  });
}

function renderPreview(){ const c=document.getElementById('previewFotos'); if(!c) return; if(!window.fotosVisita.length){c.innerHTML=''; return;} c.innerHTML=window.fotosVisita.map((s,i)=>'<div style="display:inline-block;position:relative;margin:4px"><img src="'+s+'" style="width:75px;height:75px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0"><span style="position:absolute;top:0;left:0;background:#0f172a;color:#22c55e;font-size:9px;font-weight:800;padding:2px 4px;border-radius:0 0 6px 0">#'+(i+1)+'</span><button onclick="window.fotosVisita.splice('+i+',1);renderPreview()" style="position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;border:0;border-radius:50%;width:16px;height:16px;font-size:10px">x</button></div>').join(''); }

function aplicarFirmaAHistorial(){
  const canvas = document.getElementById('canvasFirma');
  if(!canvas) return null; 
  
  // Verifica si está vacía
  const ctx = canvas.getContext('2d');
  const pixelBuffer = new Uint32Array(ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
  const esVacia = !pixelBuffer.some(color => color !== 0);
  if(esVacia) return null; 


  const firmaBase64 = canvas.toDataURL('image/png');
  const nombreAutoriza = document.getElementById('vAutoriza')?.value || '';
  const clienteCodigo = document.getElementById('vCliente')?.value || ''; // <- STRING, no .value después
  const usuario = getUsuarioActual();
  // Coge todas las visitas guardadas
  const key = 'ecoloimp_visitas_'+usuario+'_'+clienteCodigo;

  let visitas = [];
  try{ visitas = JSON.parse(localStorage.getItem(key)||'[]'); }catch(e){ visitas=[]; }

  if(visitas.length===0){ alert('No hay visitas para firmar'); return null; }

  // LES PONE LA FIRMA A TODAS
  visitas = visitas.map(v => ({
    ...v,
    firma: firmaBase64,
    autorizaNombre: nombreAutoriza || v.autorizaNombre || v.clienteNombre
  }));

  localStorage.setItem(key, JSON.stringify(visitas));
  console.log('Firma aplicada a '+visitas.length+' visitas');
  //alert('Firma aplicada a '+visitas.length+' visitas del historial');
  return { firma: firmaBase64, visitas };
}

function guardarVisita(){
  const fecha=document.getElementById('vFecha')?.value;
  const hora=document.getElementById('vHora')?.value;
  const tecnico=document.getElementById('vTecnico')?.value;
  const trabajo=document.getElementById('vTrabajo')?.value; 
  const contador=document.getElementById('vContador')?.value;
  const clienteCodigo = codigoClienteActual();
  const usuario = getUsuarioActual();

  
  if(!fecha||!hora||!tecnico||!trabajo||!contador){alert('⚠️ Falta Fecha, Hora, Técnico, Trabajo, Contador'); return;}
  if(!clienteCodigo || clienteCodigo==='GENERAL'){ alert('⚠️ Seleccione cliente'); return; }
  if(!impresoraSeleccionada?.serie){ alert('⚠️ Seleccione impresora'); return; }

  //const cliente=getClienteActual();
  const visita={
    fecha: document.getElementById('vFecha').value,
    hora: document.getElementById('vHora').value,
    tecnico: document.getElementById('vTecnico').value,
    trabajo: document.getElementById('vTrabajo').value,
    tipo: document.getElementById('vTipo').value,
    estado: document.getElementById('vEstado').value,
    email: document.getElementById('vEmail').value,
    contador: document.getElementById('vContador').value,
    obs: document.getElementById('vObs').value,
    autorizaNombre: document.getElementById('vAutoriza').value,
    cliente: clienteCodigo,
    clienteId: clienteCodigo,
    firma: firmaBase64, // <-- 1 sola vez
    fotos: [...(window.fotosVisita||[])],
    fotosCount: (window.fotosVisita||[]).length,
    serie: impresoraSeleccionada.serie,
    codigo: impresoraSeleccionada.codigo,
    modelo: impresoraSeleccionada.modelo,
    sucursal: impresoraSeleccionada.sucursal,
    area: impresoraSeleccionada.area,
    ubicacion: impresoraSeleccionada.ubicacion,
    usuario: usuario
    };
  // CAPTURA LA FIRMA DIRECTO DEL CANVAS AL GUARDAR
  let firmaFinal = null;
  const canvasFirm = document.getElementById('canvasFirma');
  if(canvasFirm){
    // verifica que no esté vacío
    const blank = document.createElement('canvas');
    blank.width = canvasFirm.width; blank.height = canvasFirm.height;
    if(canvasFirm.toDataURL() !== blank.toDataURL()){
      firmaFinal = canvasFirm.toDataURL('image/png');
    }
  }
  firmaBase64 = firmaFinal;

  const key = getKeyVisitas(usuario, clienteCodigo); 

  try{
    const todas=JSON.parse(localStorage.getItem(key)||'[]'); 
    todas.unshift(visita); 
    localStorage.setItem(key,JSON.stringify(todas));
    console.log('✅ VISITA GUARDADA', visita, 'Total:', todas.length);
  }catch(e){
    console.error('❌ ERROR GUARDANDO', e);
    // Si igual se llena, guarda sin fotos para no perder la visita
    try{
      visita.fotos = [];
      visita.fotosCount = 0;
      visita.obs = (visita.obs||'') + ' [FOTOS NO GUARDADAS POR MEMORIA LLENA]';
      const todas2 = JSON.parse(localStorage.getItem(key)||'[]');
      todas2.unshift(visita);
      localStorage.setItem(key, JSON.stringify(todas2));
      alert('⚠️ Memoria llena, se guardó la visita SIN fotos. Borra visitas viejas.');
    }catch(e2){
      alert('❌ Memoria llena de verdad. Toca GENERAR REPORTE PDF, envíalo, y luego borra el historial para seguir.');
      return;
    }
  }

  window.fotosVisita=[]; 
  renderPreview(); 
// OCULTAR DATOS DE LA IMPRESORA Y FORMULARIO AL GUARDAR
const divDatos = document.getElementById('datosImpresoraSeleccionada');
if(divDatos) divDatos.innerHTML = '';
const divForm = document.getElementById('formDatosVisita');
if(divForm) divForm.innerHTML = '';

// LIMPIAR SELECCIÓN PARA QUE NO QUEDE PEGADA
impresoraSeleccionada = null;
if(typeof limpiarFirma === 'function') limpiarFirma();

// ACTUALIZAR HISTORIAL Y LISTA DE IMPRESORAS (ya con ✅ Hecha)
mostrarListaVisitasSesion();
filtrarImpresorasCliente();
// SUBIR AL HISTORIAL PARA QUE VEA QUE SÍ SE GUARDÓ
setTimeout(()=>{
  document.getElementById('listaVisitasSesion')?.scrollIntoView({behavior:'smooth'});
}, 200);
}

function mostrarListaVisitasSesion(){
  const usuario=getUsuarioActual();
  const clienteCodigo = codigoClienteActual();
  const key = getKeyVisitas(usuario, clienteCodigo);
  if(!clienteCodigo) return;
  const cont=document.getElementById('listaVisitasSesion'); 
  if(!cont) return;

  const todas=JSON.parse(localStorage.getItem(key)||'[]');
  const lista = clienteCodigo==='GENERAL' ? [] : todas;
  console.log('BUSCANDO EN:', key, 'Encontradas:', todas.length, 'FILTRADAS:', lista.length);

  if(!lista.length){ cont.innerHTML= clienteCodigo==='GENERAL'?'':'<div style="margin-top:14px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:18px;text-align:center;color:#94a3b8">📭 Sin visitas para '+clienteCodigo+'</div>'; return; }
  let html='<div style="margin-top:16px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden"><div style="padding:14px;background:#73D17D;display:flex;justify-content:space-between;align-items:center"><b>📋 Historial '+clienteCodigo+' - '+lista.length+' visitas</b><span style="background:#0f172a;color:#fff;padding:6px 12px;border-radius:99px;font-size:11px">Sesión: '+usuario+'</span></div><div style="overflow:auto"><table style="width:100%;font-size:12px;border-collapse:collapse"><tr style="background:#fcfcfd"><th style="padding:8px">FECHA</th><th>SERIE</th><th>SUCURSAL</th><th>AREA</th><th>UBICACION</th><th>CONT</th><th>TRABAJO</th><th>FOTOS</th><th></th></tr>';
  lista.forEach(v=>{ 
    var serieSegura = String(v.serie || '').replace(/"/g, '');
    html+='<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px">'+v.fecha+' '+v.hora+'</td><td style="padding:8px"><b>'+v.serie+'</b></td><td style="padding:8px"><b>'+v.sucursal+'</b></td><td style="padding:8px"><b>'+v.area+'</b></td><td style="padding:8px"><b>'+v.ubicacion+'</b></td><td style="padding:8px">'+v.contador+'</td><td style="padding:8px">'+v.trabajo+'</td><td style="padding:8px">📸 '+v.fotosCount+'</td><td style="padding:8px"><button data-serie="' + serieSegura + '" onclick="eliminarVisita(this.dataset.serie)" style="background:#fff1f2;border:1px solid #fecaca;color:red;border-radius:6px;padding:2px 6px">🗑️</button></td></tr>'; 
  });
  html+='</table></div><div style="padding:14px;background:#f8fafc;display:flex;justify-content:center"><button onclick="generarPDFTodas()" style="background:#0f172a;color:#fff;border:0;border-radius:12px;padding:12px 24px;font-weight:800;cursor:pointer">📄 GENERAR REPORTE PDF DE TODAS LAS VISITAS - '+clienteCodigo+' ('+lista.length+')</button></div></div>';
  cont.innerHTML=html;
}

let _serieAEliminar = null;
function eliminarVisita(serie){
    _serieAEliminar = String(serie || '').trim();
  mostrarModalEliminar();
}
window.eliminarVisita = eliminarVisita;

function cerrarModalEliminar(){
  var m = document.getElementById('modalEliminarVisita');
  if(m) m.remove();
}
window.cerrarModalEliminar = cerrarModalEliminar;

function mostrarModalEliminar(){
  cerrarModalEliminar();
  var overlay = document.createElement('div');
  overlay.id = 'modalEliminarVisita';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px';
  overlay.onclick = function(){ cerrarModalEliminar(); };

  var caja = document.createElement('div');
  caja.style.cssText = 'background:#fff;border-radius:16px;width:100%;max-width:380px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.3)';
  caja.onclick = function(e){ e.stopPropagation(); };

  var titulo = document.createElement('div');
  titulo.style.cssText = 'background:#18A957;color:#fff;padding:16px;font-weight:900;font-size:16px;text-align:center';
  titulo.textContent = '🗑️ ECOLOIMP - Eliminar Visita';

  var texto = document.createElement('div');
  texto.style.cssText = 'padding:20px;text-align:center;font-size:15px;color:#334155';
  texto.textContent = '¿Eliminar la visita de la serie ' + _serieAEliminar + '? Solo se borra esa impresora de este cliente.';

  var botones = document.createElement('div');
  botones.style.cssText = 'display:flex;gap:10px;padding:0 16px 16px';

  var btnCancel = document.createElement('button');
  btnCancel.style.cssText = 'flex:1;background:#e2e8f0;border:0;border-radius:10px;padding:12px;font-weight:800';
  btnCancel.textContent = 'Cancelar';
  btnCancel.onclick = function(){ cerrarModalEliminar(); };

  var btnOk = document.createElement('button');
  btnOk.style.cssText = 'flex:1;background:#ef4444;color:#fff;border:0;border-radius:10px;padding:12px;font-weight:800';
  btnOk.textContent = 'Sí, Eliminar';
  btnOk.onclick = function(){ confirmarEliminarVisita(); };

  botones.appendChild(btnCancel);
  botones.appendChild(btnOk);
  caja.appendChild(titulo);
  caja.appendChild(texto);
  caja.appendChild(botones);
  overlay.appendChild(caja);
  document.body.appendChild(overlay);
}
window.mostrarModalEliminar = mostrarModalEliminar;

function confirmarEliminarVisita(){
  cerrarModalEliminar();
  const serieBuscada = String(_serieAEliminar || '').trim().toUpperCase();
  if(!serieBuscada){ alert('❌ Sin serie para borrar'); return; }

  try{
    const usuario = getUsuarioActual();
    const clienteCodigo = codigoClienteActual();
    const key = getKeyVisitas(usuario, clienteCodigo);
    let todasVisitas = [];
    try{ todasVisitas = JSON.parse(localStorage.getItem(key) || '[]'); }catch(e){ todasVisitas = []; }

    console.log('🗑️ Borrando cliente:', clienteCodigo, 'serie:', serieBuscada, 'antes:', todasVisitas.length);

    // ✅ SOLO borra la que coincida en CLIENTE (por la key) + SERIE
    const nuevas = todasVisitas.filter(v => String(v.serie || '').trim().toUpperCase() !== serieBuscada);

    console.log('Después:', nuevas.length);

    // Seguridad: si no borró ninguna, no toques nada
    if(nuevas.length === todasVisitas.length){
      alert('❌ No se encontró visita con serie ' + serieBuscada + ' para este cliente');
      return;
    }

    localStorage.setItem(key, JSON.stringify(nuevas));

    // Reactiva solo esa impresora en la lista
    if(typeof mostrarListaVisitasSesion === 'function') mostrarListaVisitasSesion();
    if(typeof filtrarImpresorasCliente === 'function') filtrarImpresorasCliente();

    _serieAEliminar = null;
  }catch(err){
    alert('❌ Error: ' + err.message);
  }
}
window.confirmarEliminarVisita = confirmarEliminarVisita;


 // if(!confirm('¿Eliminar esta visita?')) return;
 // const usuario=getUsuarioActual();
 // const clienteCodigo = codigoClienteActual();
 // const key = getKeyVisitas(usuario, clienteCodigo);
 // let todas=JSON.parse(localStorage.getItem(key)||'[]');
 // todas=todas.filter(v=>v.id != id);
 // localStorage.setItem(key, JSON.stringify(todas));
 // mostrarListaVisitasSesion();
 // filtrarImpresorasCliente();
//}

function iniciarFirma(){
  const canvas = document.getElementById('canvasFirma');
  if(!canvas) return;
  // Si está oculto, no inicializar aún
  if(canvas.offsetParent === null){ setTimeout(iniciarFirma, 300); return; }

  canvas.width = 600; canvas.height = 250;
  ctxFirma = canvas.getContext('2d');
  ctxFirma.lineWidth=4; ctxFirma.lineCap='round'; ctxFirma.lineJoin='round'; ctxFirma.strokeStyle='#000';
  
  let dib=false;
  const getPos = (e)=>{
    const r=canvas.getBoundingClientRect();
    const t=e.touches?e.touches[0]:e;
    return {x:(t.clientX-r.left)*(canvas.width/r.width), y:(t.clientY-r.top)*(canvas.height/r.height)};
  };
  const s=(e)=>{ e.preventDefault(); dib=true; const p=getPos(e); ctxFirma.beginPath(); ctxFirma.moveTo(p.x,p.y); firmaDibujada=true; };
  const m=(e)=>{ if(!dib) return; e.preventDefault(); const p=getPos(e); ctxFirma.lineTo(p.x,p.y); ctxFirma.stroke(); firmaDataURL=canvas.toDataURL('image/png'); firmaBase64=firmaDataURL; };
  const e=(ev)=>{ if(dib){ dib=false; firmaDataURL=canvas.toDataURL('image/png'); firmaBase64=firmaDataURL; document.getElementById('estadoFirma').innerText='✅ Firma OK - '+firmaDataURL.length+' bytes'; document.getElementById('estadoFirma').style.color='green'; }};

  canvas.addEventListener('mousedown',s); canvas.addEventListener('mousemove',m); canvas.addEventListener('mouseup',e); canvas.addEventListener('mouseleave',e);
  canvas.addEventListener('touchstart',s,{passive:false}); canvas.addEventListener('touchmove',m,{passive:false}); canvas.addEventListener('touchend',e,{passive:false});
}

function limpiarFirma(){
  const c=document.getElementById('canvasFirma'); if(!c) return;
  c.getContext('2d').clearRect(0,0,c.width,c.height);
  firmaDibujada=false; firmaDataURL=null; firmaBase64=null;
  document.getElementById('estadoFirma').innerText='Si no firma aquí, quedará la línea para firmar a mano en el PDF';
  document.getElementById('estadoFirma').style.color='#64748b';
}


function guardarFirma(){
  const c=document.getElementById('canvasFirma'); if(!c) return;
  firmaBase64=c.toDataURL('image/png');
  document.getElementById('estadoFirma').innerText='✅ Firma guardada';
  document.getElementById('estadoFirma').style.color='#16a34a';
}

async function enviarCorreoVisita(){
  const gcorreo = "dennistigreros@gmail.com";
  try{
    const elEmail = document.getElementById("vEmail");
    const elFecha = document.getElementById("vFecha");
    const elMsg = document.getElementById("vMessage");
    const nombreFirma = document.getElementById("vAutoriza")?.value || "Cliente";
    const emailCliente = elEmail.value.trim()||'';
    const {codigo, nombre} = obtenerCodigoYNombre();
    const fechaVal = elFecha?.value || new Date().toLocaleDateString();
    if(elMsg){ elMsg.style.color="#334155"; elMsg.textContent = "⏳ Generando PDF..."; }

    const usuario=getUsuarioActual(); 
    const clienteCodigo = codigoClienteActual();

    if(!clienteCodigo || clienteCodigo==='GENERAL'){ alert('Seleccione cliente'); return; }

    const key = getKeyVisitas(usuario, clienteCodigo);
    const todas=JSON.parse(localStorage.getItem(key)||'[]');
    const lista=todas.filter(v=>String(v.clienteId||v.cliente||'').trim().toUpperCase()===String(clienteCodigo||'').trim().toUpperCase());

  if(!lista.length){ alert('No hay visitas para '+clienteCodigo); return; }
  await cargarLogo();

    const docpdf = await generarPDFConVisitas(lista, '');
    if(!docpdf || typeof docpdf.output !== 'function'){
      throw new Error('generarPDFConVisitas() no retorno PDF. Revisa que termine con return doc;');
    }

    const tieneFirma = firmaDibujada && firmaDataURL;
    const firmaTexto = tieneFirma ? "Sí, registrada en PDF" : "No registrada";
    const pdfBase64 = docpdf.output('datauristring').split(',')[1];
    const txt = generarVisitaTXT();
    const txtBase64 = btoa(unescape(encodeURIComponent(txt)));
    //const nombre = document.getElementById("vCliente").value;
    const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#111;line-height:1.5">
      <b>ECOLOIMP S.A.</b><br>
      <b>REPORTE DE VISITA TÉCNICA</b><br>
      ═════════════════════════<br><br>
  <p style="margin:0 0 12px 0">Estimado cliente <b>${nombre} (${codigo})</b>,</p>
  <p style="margin:0 0 12px 0">Se ha realizado la visita técnica con el siguente detalle.</b>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin:14px 0">
    <div style="font-weight:bold;margin-bottom:6px"> 📅 INFORMACIÓN DE VISITA</div>
    <div>Cliente: <b>${nombre} (${codigo})</b></div>
    <div>Fecha  : <b>${fechaVal}</b></div>
  </div>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin:14px 0">
    <div style="font-weight:bold;margin-bottom:6px">✍️ CONFORMIDAD</div>
    <div> Firmado por: <b>${nombreFirma}</b></div>
    <div> Firma digital: <b>${firmaTexto}</b></div>
  </div>

  <div style="margin:14px 0">
    Se adjuntan:<br>
    - Reporte en PDF con firma<br>
    - Respaldo en TXT
  </div>

  <div style="margin-top:16px">
    Gracias por confiar en ECOLOIMP.<br><br>
    Atentamente,<br>
    <b>Departamento Técnico - ECOLOIMP S.A.</b><br>
    <span style="color:#2563eb">www.ecoloimp.com</span>
    ${gcorreo}
  </div>
</div>`;

    // YA NO USO c - uso clienteVisita seguro

    const nombreBase = `VT_${codigo}_${fechaVal}`.replace(/[^a-zA-Z0-9_\-]/g,"_");

    const resp = await fetch(URL_APPS_SCRIPT, {
      method: "POST",
      headers: {"Content-Type":"text/plain;charset=utf-8"},
      body: JSON.stringify({
        para: gcorreo,
        cc: emailCliente,
        asunto: `Visita Tecnica - ${fechaVal}`,
        html: html,
        pdfBase64: pdfBase64,
        pdfNombre: nombreBase + ".pdf",
        txtBase64: txtBase64,
        txtNombre: nombreBase + ".txt"
      })
    });

    if(!resp.ok) throw new Error('El correo no se envió, código ' + resp.status);
    //if(elMsg){ elMsg.style.color = "green"; elMsg.textContent = "✅ Enviado a Administracion y Servicio con copia a " + emailCliente; }
    
        // ===== LIMPIAR MEMORIA CON LA LLAVE ORIGINAL, ANTES DE BORRAR LA VARIABLE =====
    const cantidad = lista.length;
    localStorage.removeItem(key);
    console.log('🧹 Limpieza:', key, cantidad, 'visitas');

    // 1. Limpiar variables
    window.fotosVisita = [];
    impresoraSeleccionada = null;
    if(typeof clienteActual !== 'undefined') clienteActual = '';
    // Si tienes una variable global clienteCodigo, límpiala aquí, pero NO la const de arriba
    if(typeof window.clienteCodigo !== 'undefined') window.clienteCodigo = '';

    // 2. Dejar SIN cliente seleccionado
    const selCliente = document.getElementById('vCliente');
    if(selCliente){
      selCliente.selectedIndex = 0;
      selCliente.value = '';
    }

    // 3. Vaciar lista de impresoras
    const divLista = document.getElementById('listaImpresoras');
    if(divLista) divLista.innerHTML = '';

    // 4. Vaciar datos de impresora y formulario
    const d1 = document.getElementById('datosImpresoraSeleccionada');
    if(d1) d1.innerHTML = '';
    const d2 = document.getElementById('formDatosVisita');
    if(d2) d2.innerHTML = '';

    // 5. Limpiar email, autoriza y firma - CON LOS IDS REALES
    if(elEmail) elEmail.value = '';
    const inpAutoriza = document.getElementById('vAutoriza');
    if(inpAutoriza) inpAutoriza.value = '';
    if(typeof limpiarFirma === 'function') limpiarFirma();

    // 6. Vaciar historial
    if(typeof mostrarListaVisitasSesion === 'function') mostrarListaVisitasSesion();

    alert('✅ Correo enviado. Se limpiaron ' + cantidad + ' visitas de ' + clienteCodigoOriginal + ' de la memoria. Ya puedes seguir con otro cliente.');

  }catch(err){
    console.error(err);
    alert("Error: " + err.message);
    const elMsg = document.getElementById("vMessage");
    if(elMsg){ elMsg.style.color = "red"; elMsg.textContent = "Error: " + err.message; }
  }
}

function generarVisitaTXT(){
  const usuario=getUsuarioActual(); 
  const clienteCodigo = codigoClienteActual();
  const key = getKeyVisitas(usuario, clienteCodigo);
  let visitas = [];
  visitas = JSON.parse(localStorage.getItem(key)||'[]');
  if(visitas.length===0){ alert('No hay visitas'); return; }

  let txt = '';
  // CABECERA
  txt += 'FECHA;HORA;CLIENTE_ID;EQUIPO;SERIE;SUCURSAL;AREA;UBICACION;CONTADOR;TECNICO;TIPO;TRABAJO;ESTADO;DETALLE;AUTORIZA;TIENE_FIRMA;NUM_FOTOS\n';

  visitas.forEach(v=>{
    const limpiar = (s)=> String(s||'').replace(/;/g, ',').replace(/\n|\r/g, ' ').trim();
    
    const fila = [
      limpiar(v.fecha),
      limpiar(v.hora),
      limpiar(v.cliente),
      limpiar(v.codigo),
      limpiar(v.serie),
      limpiar(v.sucursal),
      limpiar(v.area),
      limpiar(v.ubicacion),
      limpiar(v.contador),
      limpiar(v.tecnico),
      limpiar(v.tipo),
      limpiar(v.trabajo),
      limpiar(v.estado),
      limpiar(v.obs),
      limpiar(v.autorizaNombre),
      v.firma ? 'SI' : 'NO',
      v.fotos?.length||0
    ].join(';');

    txt += fila + '\n';
  });
 return txt;
  //const blob = new Blob([txt], {type:'text/plain;charset=utf-8'});
  //const url = URL.createObjectURL(blob);
  //const a = document.createElement('a');
  //a.href = url;
  //a.download = 'VISITAS_'+ new Date().toISOString().slice(0,10) +'.txt';
  //a.click();
  //URL.revokeObjectURL(url);
}

function getClienteDesc(codigo, visita){
  if(visita?.clienteDesc) return visita.clienteDesc;
  // Buscar en DB.tecnicos que ya cargaste de tecnicos.txt
  const encontrado = (DB.clientes || []).find(c => String(c.codigo).trim() === String(codigo).trim());
  if(encontrado) return `${encontrado.codigo} - ${encontrado.nombre}`;
  return codigo;
}

function getTecnicoDesc(codigo, visita){
  if(visita?.tecnicoDesc) return visita.tecnicoDesc;
  // Buscar en DB.tecnicos que ya cargaste de tecnicos.txt
  const encontrado = (DB.tecnicos || []).find(t => String(t.codigo).trim() === String(codigo).trim());
  if(encontrado) return `${encontrado.codigo} - ${encontrado.nombre}`;
  return codigo;
}

function getTrabajoDesc(codigo, visita){
  if(visita?.trabajoDesc) return visita.trabajoDesc;
  // Buscar en DB.tecnicos que ya cargaste de tecnicos.txt
  const encontrado = (DB.trabajos || []).find(t => String(t.codigo).trim() === String(codigo).trim());
  if(encontrado) return `${encontrado.codigo} - ${encontrado.nombre}`;
  return codigo;
}


async function generarPDFTodas(){
  aplicarFirmaAHistorial();
  
  const usuario=getUsuarioActual(); 
  const clienteCodigo = codigoClienteActual();
  const key = getKeyVisitas(usuario, clienteCodigo);
  if(!clienteCodigo || clienteCodigo==='GENERAL'){ alert('Seleccione cliente'); return; }

  // DEFINIMOS todas ANTES DE USARLA - ESTE ERA EL ERROR DE LA LÍNEA 671
  const todas=JSON.parse(localStorage.getItem(key)||'[]');
  const lista=todas.filter(v=>String(v.clienteId||v.cliente||'').trim().toUpperCase()===String(clienteCodigo||'').trim().toUpperCase());

  console.log('PDF - Buscando en:', key, 'Encontradas:', todas.length, 'Filtradas:', lista.length);
  if(!lista.length){ alert('No hay visitas para '+clienteCodigo); return; }
  await cargarLogo();
  const modo='ver';
  generarPDFConVisitas(lista, modo);
}

function generarPDFConVisitas(listaForzada, modo){
  const usuario=getUsuarioActual(); 
  const {codigo, nombre} = obtenerCodigoYNombre();
  const cliente=document.getElementById('vCliente'); 
  const clienteCodigo = cliente?.value || '';

  //todas.filter(v=>norm(v.clienteId||v.cliente)===norm(cliente))
  //const visitas=todas.filter(v=>String(v.clienteId).toUpperCase()===codigo);
  const visitas = listaForzada;
  if(!visitas){
    const key='ecoloimp_visitas_'+usuario+'_'+clienteCodigo;
    const todas=JSON.parse(localStorage.getItem(key)||'[]');
    visitas=todas.filter(v=>String(v.clienteId||v.cliente||'').trim().toUpperCase()===String(clienteCodigo||'').trim().toUpperCase());
  }
  console.log('PDF - Generando con:', visitas.length, 'visitas de', clienteCodigo);

  if(!visitas.length){ alert('No hay visitas para '+cliente.value); return; }
  cargarLogo();
  
  const jsPDFLib=window.jspdf?.jsPDF||window.jsPDF; if(!jsPDFLib){alert('jsPDF no cargado'); return;}
  const doc=new jsPDFLib('p','mm','a4');
  const nombreU=getNombreUsuario();
  const fechaImpresion=new Date().toLocaleString('es-EC', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true});

  let totalPags=0; visitas.forEach(v=>{ totalPags+=1 + Math.ceil((v.fotos?.length||0)/3); });
  let paginaActual=0;

  const pie=(pg, tot)=>{
    doc.setDrawColor(220); doc.line(10,282,200,282);
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(0);
    doc.text('© 2026 DT Soluciones Informáticas - Desarrollado para Ecoloimp S.A.', 10, 287);
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(0);
    doc.text('Página '+pg+' de '+tot, 200, 287, {align:'right'});
  };

  visitas.forEach((v)=>{
    paginaActual++; if(paginaActual>1) doc.addPage();
    if(LOGO_BASE64){ try{ doc.addImage(LOGO_BASE64,'PNG',10,5,55,14); }catch(e){} }
    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(0);
    doc.text('REPORTE DE VISITA TECNICA', 105, 12, {align:'center'});
    doc.setFont('helvetica','bold'); doc.setFontSize(8);
    doc.text('Usuario: '+usuario, 195, 6, {align:'right'});
    doc.setFont('helvetica','normal'); doc.setFontSize(8);
    doc.text(nombreU, 195, 10, {align:'right'});
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(60);
    doc.text(fechaImpresion, 195, 14, {align:'right'});
    doc.setDrawColor(22,163,74); doc.setLineWidth(0.8); doc.line(10,22,200,22); doc.setLineWidth(0.2); doc.setDrawColor(0);

    let y=26; const leftW=38; const tableX=10; const tableW=190; const rowH=7;
    const drawRow=(l,val)=>{
      doc.setFillColor(245,245,245); doc.rect(tableX, y, leftW, rowH, 'F');
      doc.rect(tableX, y, tableW, rowH, 'S'); doc.line(tableX+leftW, y, tableX+leftW, y+rowH);
      doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(0); doc.text(l.toUpperCase(), tableX+2, y+4.5);
      doc.setFont('helvetica','normal'); doc.text(String(val||'-').substring(0,80), tableX+leftW+2, y+4.5);
      y+=rowH;
    };

    let yG1=y;
    drawRow('FECHA', v.fecha+' '+v.hora);
    drawRow('CLIENTE', v.clienteId+' - '+nombre);
    drawRow('EQUIPO', (v.codigo? v.codigo+' - ':'')+v.modelo);
    drawRow('SERIE', v.serie);
    drawRow('SUCURSAL', v.sucursal);
    drawRow('AREA', v.area);
    drawRow('UBICACION', v.ubicacion||v.bodega||'-');
    drawRow('CONTADOR', v.contador||'-');
    doc.setDrawColor(0); doc.setLineWidth(0.4); doc.rect(tableX, yG1, tableW, y-yG1, 'S'); doc.setLineWidth(0.2);

    y+=3; 
    //doc.setDrawColor(22,163,74); doc.setLineWidth(0.6); doc.line(tableX, y, tableX+tableW, y); doc.setLineWidth(0.2); doc.setDrawColor(0); y+=4;

    let yG2=y;
    drawRow('TECNICO', getTecnicoDesc(v.tecnico, v));
    drawRow('TIPO DE VISITA', v.tipo||'correctiva');
    drawRow('TRABAJO', getTrabajoDesc(v.trabajo, v));
    drawRow('ESTADO', v.estado||'finalizada');
    drawRow('EMAIL CLIENTE', v.email||'-');
    drawRow('FIRMA DIGITAL', v.firma ? 'Si' : 'No');
    doc.setDrawColor(0); doc.setLineWidth(0.4); doc.rect(tableX, yG2, tableW, y-yG2, 'S'); doc.setLineWidth(0.2);

    y+=3;
    doc.setFillColor(245,245,245); doc.rect(tableX, y, tableW, rowH, 'FD');
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.text('DETALLE / TRABAJO REALIZADO:', tableX+2, y+4.5);
    y+=rowH;
    const detalleLines=doc.splitTextToSize(v.obs||'Sin observaciones', tableW-4);
    const detalleH=Math.max(35, detalleLines.length*4 + 8);
    doc.rect(tableX, y, tableW, detalleH, 'S');
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.text(detalleLines, tableX+2, y+5);

    y += detalleH + 6;
    const firmaH = 45;
    if(y+firmaH > 270){ doc.addPage(); y=20; }
// RECUADRO BIEN REMARCADO
    doc.setDrawColor(0); doc.setLineWidth(0.8); // Borde exterior grueso
    doc.rect(tableX, y, tableW, firmaH);
    
        // --- BLOQUE FIRMA DE CONFORMIDAD CENTRADA ---
    // FIRMA CENTRADA
    if(y + firmaH > 275){ doc.addPage(); y = 15; }

    doc.setDrawColor(0); doc.setLineWidth(0.8);
    doc.rect(tableX, y, tableW, firmaH);
    doc.setFillColor(220,220,220);
    doc.rect(tableX, y, tableW, 8, 'F');
    doc.setDrawColor(0); doc.setLineWidth(0.5);
    doc.line(tableX, y+8, tableX+tableW, y+8);
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(0);
    doc.text('FIRMA DE CONFORMIDAD - CLIENTE', tableX+3, y+5.5);

    if(v.firma && v.firma.length > 100){
      try{
        let fmt = v.firma.includes('png') ? 'PNG' : 'JPEG';
        let imgW = 60, imgH = 20;
        let imgX = tableX + (tableW/2) - (imgW/2);
        let imgY = y + 11;
        doc.addImage(v.firma, fmt, imgX, imgY, imgW, imgH);
      }catch(e){}
    }
    const lineaW = 140;
    const lineaX = tableX + (tableW/2) - (lineaW/2);
    const lineaY = y + firmaH - 12;
    doc.setDrawColor(0); doc.setLineWidth(0.3);
    doc.line(lineaX, lineaY, lineaX+lineaW, lineaY);
    doc.setFont('helvetica','bold'); doc.setFontSize(8);
    
    y += firmaH + 10;

    // NOMBRE CORREGIDO - USA v.autorizaNombre
    const nombreFirmaFinal = (v.autorizaNombre || v.clienteNombre || '').substring(0,60);
    doc.text(nombreFirmaFinal, 105, lineaY+5, {align:'center'});
    y += firmaH + 4;

    pie(paginaActual, totalPags);

    if(v.fotos && v.fotos.length>0){
      let fIdx=0;
      while(fIdx < v.fotos.length){
        doc.addPage(); paginaActual++;
        if(LOGO_BASE64){ try{ doc.addImage(LOGO_BASE64,'PNG',10,5,55,14);}catch(e){} }
        doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.text('REPORTE DE VISITA TECNICA',105,12,{align:'center'});
        doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.text('Usuario: '+usuario,195,6,{align:'right'});
        doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.text(nombreU,195,10,{align:'right'});
        doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.text(fechaImpresion,195,14,{align:'right'});
        doc.setDrawColor(22,163,74); doc.setLineWidth(0.8); doc.line(10,22,200,22); doc.setLineWidth(0.2);
        doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.text('FOTOS - '+v.serie,10,28);
        let yFoto=30;
        const fotoH = 78; // Alto perfecto para 3 fotos
        const gap = 4; // Espacio entre fotos
        for(let k=0;k<3 && fIdx < v.fotos.length;k++){
          try{
            let fmt=v.fotos[fIdx].includes('png')?'PNG':'JPEG';
            // Marco
            doc.setDrawColor(180); doc.setLineWidth(0.3);
            doc.rect(10, yFoto, 190, fotoH, 'S');
            // Imagen ocupando 95% del marco
            doc.addImage(v.fotos[fIdx], fmt, 11, yFoto+1, 188, fotoH-8);
            // Texto
            doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(0);
            doc.text('Foto '+(fIdx+1)+' - '+v.serie+' - '+(v.fecha||''), 12, yFoto+fotoH-2);
            yFoto+=fotoH+gap;
          }catch(e){ console.log(e); }
          fIdx++;
        }
        pie(paginaActual, totalPags);
      }
    }
  });
  if(modo === 'ver'){
     window.open(doc.output('bloburl'),'_blank');
  }
  return doc;
}

setTimeout(iniciarFirma,120);

window.filtrarImpresorasCliente=filtrarImpresorasCliente; 
window.seleccionarImpresora=seleccionarImpresora; 
window.guardarVisita=guardarVisita; 
window.eliminarVisita=eliminarVisita; 
window.procesarFotos=procesarFotos; 
window.generarPDFTodas=generarPDFTodas; 
window.getNombreUsuario=getNombreUsuario;
document.addEventListener('DOMContentLoaded', async()=>{ await cargarUsuariosTxt(); await cargarLogo(); const sel=document.getElementById('vCliente'); if(sel) sel.addEventListener('change', filtrarImpresorasCliente); mostrarListaVisitasSesion(); });
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(iniciarFirma, 500);
  });
window.limpiarFirma = limpiarFirma;
