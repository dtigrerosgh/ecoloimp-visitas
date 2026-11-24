window.DB = window.DB || { usuarios:[], clientes:[], bodegas:[], tecnicos:[], impresoras:[], inventarios:[], productos:[] };
//const gcorreo = "administracion@ecoloimp.com, servicio@ecoloimp.com";
const gcorreo = "dennistigreros@gmail.com";
const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbwhsoiMq7lPCBwWb1jIiVTAJ5fnSa4rE9jZiqlLP38vE3hh0bcNa4r0JuwFnrpQhBt2/exec";

const esc=s=>(s??"").toString().replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

async function cargarTxt(ruta){
  try{
    const r = await fetch(ruta+'?v='+Date.now());
    if(!r.ok) return [];
    
    const buffer = await r.arrayBuffer();
    let txt;
    try{
      txt = new TextDecoder('windows-1252').decode(buffer);
    }catch(e){
      txt = new TextDecoder('utf-8').decode(buffer);
    }

    // QUITA ACENTOS Y CARACTERES ESPECIALES
    txt = txt.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Á -> A, é -> e
    txt = txt.replace(/ñ/g, 'n').replace(/Ñ/g, 'N'); // ñ -> n
    
    return txt.split('\n').map(s=>s.trim()).filter(s=>s&&!s.startsWith('#'));
  }catch(e){ console.log('Error cargando '+ruta,e); return []; }
}

async function initApp(){
  const status = document.getElementById('loadStatus');
  const btn = document.getElementById('btnLogin');
  try{
    if(status) status.textContent = '⏳ Cargando data/*.txt...';
    
    // USUARIOS
    const u = await cargarTxt('./data/usuarios.txt');
    DB.usuarios = u.map(l=>{ 
      const p=l.split(';'); 
      return {usuario:p[0]?.trim(), pass:p[1]?.trim(), nombre:p[2]?.trim(), tipo:p[3]?.trim(), tecnico:p[3]?.trim()} }).filter(x=>x.usuario);
    
    // CLIENTES
    const c = await cargarTxt('./data/clientes.txt');
    DB.clientes = c.map(l=>{
      const p=l.split(';').map(x=>x.trim());
      return {id:p[0], nombre:p[1]||p[0], impresoras:p[2]||''};
    }).filter(x=>x.id);
    
    // IMPRESORAS - ESTA ES LA CLAVE
    const impLines = await cargarTxt('./data/impresoras.txt');
    DB.impresoras = impLines.map(l=>{
      const p=l.split(';').map(x=>x.trim());
      return {cliente:p[0],codigo:p[1],modelo:p[2],serie:p[3]||p[1],sucursal:p[4],area:p[5],ubicacion:p[6],ip:p[6],bodega:p[7]}
    }).filter(x=>x.cliente&&x.serie);
    

    // TRABAJOS - CORREGIDO AQUI ESTABA EL ERROR
    const tr = await cargarTxt('./data/trabajos.txt');
    DB.trabajos = tr.map(l=>{ 
      const p=l.split(';'); 
      return {codigo:p[0]?.trim(), nombre:p[1]?.trim()} 
    }).filter(x=>x.codigo);

        // TECNICOS 
    const t = await cargarTxt('./data/tecnicos.txt');
    DB.tecnicos = t.map(l=>{ 
      const p=l.split(';'); 
      return {codigo:p[0]?.trim(), nombre:p[1]?.trim()} 
    }).filter(x=>x.codigo);
    
    // BODEGAS 
    const b = await cargarTxt('./data/bodegas.txt');
    DB.bodegas = b.map(l=>{ 
      const p=l.split(';'); 
      return {codigo:p[0]?.trim(), nombre:p[1]?.trim()} 
    }).filter(x=>x.codigo);

    // PRODUCTOS 
    const pr = await cargarTxt('./data/productos.txt');
    DB.productos = pr.map(l=>{ 
      const p=l.split(';'); 
      return {codigo:p[0]?.trim(), nombre:p[1]?.trim()} 
    }).filter(x=>x.codigo);

    // INVENTARIOS 
    const i = await cargarTxt('./data/productos.txt');
    DB.inventarios = i.map(l=>{ 
      const p=l.split(';'); 
      return {bodega:p[0]?.trim(), codigo:p[1]?.trim(), alterno:p[2]?.trim(), nombre:p[3]?.trim()} 
    }).filter(x=>x.bodega);

    // Guardar en localStorage para visita.js
    localStorage.setItem('ecoloimp_impresoras', JSON.stringify(DB.impresoras));
    localStorage.setItem('ecoloimp_clientes', JSON.stringify(DB.clientes));
    
    console.log('CARGADO:', DB.clientes.length,'clientes', DB.impresoras.length,'impresoras');
    
    // PINTAR CLIENTES EN EL SELECT
    const sel = document.getElementById('vCliente');
    if(sel){
      sel.innerHTML = '<option value="">-- Seleccione un cliente --</option>';
      DB.clientes.forEach(cl=>{
        const opt = document.createElement('option');
        opt.value = cl.id;
        opt.textContent = cl.id + ' - ' + cl.nombre;
        sel.appendChild(opt);
      });
      console.log('Select vCliente llenado con', DB.clientes.length);
    }
    
    // KPIs bienvenida
    document.getElementById('kpiUsuarios').textContent = DB.usuarios.length;
    document.getElementById('kpiCli').textContent = DB.clientes.length;
    document.getElementById('kpiImp').textContent = DB.impresoras.length;
    document.getElementById('kpiTec').textContent = DB.tecnicos.length;
    document.getElementById('kpiTra').textContent = DB.trabajos.length;
    document.getElementById('kpiBod').textContent = DB.bodegas.length;
    document.getElementById('kpiPro').textContent = DB.productos.length;
    document.getElementById('kpiInv').textContent = DB.inventarios.length;
    document.getElementById('kpiTotal').textContent = DB.clientes.length + DB.impresoras.length;
    
    if(status){ status.textContent = `✅ Cargado: ${DB.clientes.length} clientes, ${DB.impresoras.length} impresoras`; status.className='status ok'; }
    if(btn){ btn.disabled=false; btn.textContent='Ingresar'; }
    
  }catch(e){
    console.error(e);
    if(status) status.textContent='❌ Error cargando txt: '+e.message;
  }
}

function login(){
  const u = document.getElementById('lgUser').value.trim().toUpperCase();
  const p = document.getElementById('lgPass').value.trim();
  const found = DB.usuarios.find(x=>x.usuario.toUpperCase()===u && x.pass===p);
  if(!found && DB.usuarios.length>0){ alert('Usuario/clave incorrecto'); return; }
  const user = found||{usuario:u, nombre:u, tipo:'ADMIN'};
  localStorage.setItem('ecoloimp_usuario', user.usuario);
  localStorage.setItem('ecoloimp_nombre', user.nombre||user.usuario);
  document.getElementById('loginPage').style.display='none';
  document.getElementById('app').style.display='block';
  document.getElementById('uUsuario').textContent=user.usuario;
  document.getElementById('uName').textContent=user.nombre||user.usuario;
  document.getElementById('uRole').textContent=user.tipo||'';
  document.getElementById('welcomeName').textContent=user.nombre||user.usuario;
  showPage('bienvenida');
}

function showPage(p){
  document.querySelectorAll('.page').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.nav button').forEach(el=>el.classList.remove('active'));
  document.getElementById('pg-'+p)?.classList.add('active');
  document.querySelector(`[data-p="${p}"]`)?.classList.add('active');
  if(p==='visitas'){
    // asegurar que el select de clientes esté lleno
    if(DB.clientes.length>0 && document.getElementById('vCliente').options.length<=1){
      const sel=document.getElementById('vCliente');
      sel.innerHTML='<option value="">-- Seleccione un cliente --</option>';
      DB.clientes.forEach(cl=>{ const o=document.createElement('option'); o.value=cl.id; o.textContent=cl.id+' - '+cl.nombre; sel.appendChild(o); });
    }
    if(typeof filtrarImpresorasCliente==='function'){
      // no auto filtrar, solo limpiar
      const cont=document.getElementById('listaImpresoras');
      if(cont && !document.getElementById('vCliente').value) cont.innerHTML='<div style="padding:20px;text-align:center;color:#94a3b8;border:1.5px dashed #e2e8f0;border-radius:12px">👆 Selecciona un cliente</div>';
    }
  }
}
function logout(){ localStorage.removeItem('ecoloimp_usuario'); location.reload(); }

document.addEventListener('DOMContentLoaded', initApp);

// HAMBURGUESA SOLO CELULAR - se crea sola
document.addEventListener('DOMContentLoaded', () => {
  if(window.innerWidth > 768) return;
  if(document.getElementById('btnHamburguesa')) return;

  const header = document.querySelector('header') || document.querySelector('.header') || document.querySelector('.topbar');
  const menu = document.querySelector('.tabs') || document.querySelector('.menu') || document.getElementById('menuPrincipal');
  if(!header || !menu) return;

  const btn = document.createElement('button');
  btn.id = 'btnHamburguesa';
  btn.textContent = '☰';
  btn.onclick = (e) => {
    e.stopPropagation();
    menu.classList.toggle('abierto');
  };
  header.prepend(btn);

  // Cerrar al elegir una opción
  menu.querySelectorAll('button').forEach(b => {
    b.addEventListener('click', () => menu.classList.remove('abierto'));
  });

  // Cerrar si toca fuera
  document.addEventListener('click', (e) => {
    if(!menu.contains(e.target) && e.target !== btn){
      menu.classList.remove('abierto');
    }
  });
});

function toggleMenu(cerrar){
  const menu = document.querySelector('.tabs') || document.querySelector('.menu');
  if(!menu) return;
  if(cerrar === true) menu.classList.remove('abierto');
  else menu.classList.toggle('abierto');
}

// FORZAR MODO CELULAR - no depende solo del CSS
function aplicarModoCelular(){
  const esCelular = window.innerWidth <= 768 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
  document.body.classList.toggle('es-celular', esCelular);
  console.log('Es celular?', esCelular, 'Ancho:', window.innerWidth);
}
window.addEventListener('resize', aplicarModoCelular);
document.addEventListener('DOMContentLoaded', aplicarModoCelular);
aplicarModoCelular();
