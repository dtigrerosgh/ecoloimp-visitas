

function guardarVisita(){
  const c = selectedClientVisita();
  const p = DB.visitaPrinter;
  const t = DB.tecnicos.find(x=>x.codigo===$("vtTecnico")?.value);
  const tr = DB.trabajos.find(x=>x.codigo===$("vtTrabajo")?.value);
  if(!c) return alert("Seleccione cliente");
  if(!p) return alert("Seleccione impresora");

  const visita = {
    id: Date.now(),
    usuario: getUsuarioActual(), // <--- guarda quien la hizo
    fecha: $("vtFecha").value,
    hora: $("vtHora").value,
    cliente: c.codigo,
    clienteNombre: c.nombre,
    codigo: p.codigo,
    modelo: p.modelo,
    serie: p.serie,
    sede: p.sede,
    ubicacion: p.ubicacion,
    ip: p.ip,
    bodega: p.bodega,
    contador: $("vtContador").value,
    tecnico: t.codigo,
    tecnicoNombre: t.nombre,
    trabajo: tr ? tr.codigo : "",
    trabajoNombre: tr ? tr.nombre : "",
    tipo: $("vtTipo").value,
    estado: $("vtEstado").value,
    email: $("vtEmail").value,
    detalle: $("vtDetalle").value,
    nombreFirma: $("vtNombreFirma").value,
    fotos: [...FOTOS_DB.fotosVisita],
    fotos2: [...FOTOS_DB.fotosVisita2]
  };

  let hist = JSON.parse(localStorage.getItem(keyVisita())||"[]");
  const idx = hist.findIndex(h=>h.serie===p.serie && h.fecha===visita.fecha);
  if(idx>=0){
    if(!confirm(`Ya existe ${p.serie} el ${visita.fecha}. ¿Actualizar?`)) return;
    hist[idx]=visita;
  }else{
    hist.push(visita);
  }
  localStorage.setItem(keyVisita(), JSON.stringify(hist));
  alert(`✅ [${getUsuarioActual()}] Guardada ${p.serie} - Total: ${hist.length}`);
  FOTOS_DB.fotosVisita=[]; FOTOS_DB.fotosVisita2=[];
  if($("vtFotosPreview")) $("vtFotosPreview").innerHTML="";
  if($("vtFotos2Preview")) $("vtFotos2Preview").innerHTML="";
  actualizarVisitaHistorialTabla();
}

function actualizarVisitaHistorialTabla(){
  const hist = JSON.parse(localStorage.getItem(keyVisita())||"[]");
  if($("vtHistorialCount")) $("vtHistorialCount").innerHTML = `Usuario: <b>${getUsuarioActual()}</b> - Guardadas: <b>${hist.length}</b>`;
  if($("vtHistorialBody")){
    $("vtHistorialBody").innerHTML = hist.length? hist.map((h,i)=>`
      <tr><td>${i+1}</td><td>${h.fecha}</td><td><b>${h.serie}</b></td><td>${h.sede}</td><td>${h.contador}</td><td>${h.fotos.length+h.fotos2.length} fotos</td><td><button class="btn ghost" onclick="borrarVisitaHistorial(${h.id})">X</button></td></tr>
    `).join("") : `<tr><td colspan="7">Sin visitas de ${getUsuarioActual()}</td></tr>`;
  }
}

function borrarVisitaHistorial(id){
  if(!confirm("¿Borrar esta visita?")) return;
  let hist = JSON.parse(localStorage.getItem(keyVisita())||"[]");
  hist = hist.filter(h=>h.id!==id);
  localStorage.setItem(keyVisita(), JSON.stringify(hist));
  actualizarVisitaHistorialTabla();
}

function limpiarHistorialVisita(){
  let hist = JSON.parse(localStorage.getItem(keyVisita())||"[]");
  if(!confirm(`¿Borrar TODAS las ${hist.length} visitas de ${getUsuarioActual()}?`)) return;
  localStorage.removeItem(keyVisita());
  actualizarVisitaHistorialTabla();
}

async function generarVisitaHistorialPDF(){
  /7const hist = JSON.parse(localStorage.getItem("ecoloimp_visita")||"[]");
  let hist = JSON.parse(localStorage.getItem(keyVisita())||"[]");
  if(hist.length===0) throw new Error("No hay visitas guardadas");
  
  const c = DB.clientes.find(x=>x.codigo===hist[0].cliente) || {codigo:hist[0].cliente, nombre:hist[0].clienteNombre};
  const usuarioActual = localStorage.getItem('ecoloimp_session') || 'Invitado';
  const logoBase64 = await getLogoBase64().catch(()=>null);
  const firmaData = (()=>{ try{ return firmaDibujada? $("vtFirmaCanvas").toDataURL("image/png") : null; }catch{return null;} })();
  const firmaNombre = $("vtNombreFirma")?.value || hist[hist.length-1].nombreFirma || "Cliente";
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({orientation:"portrait", unit:"mm", format:"a4"});
  const pageW = 210, pageH = 297;
  let y=30;

  function drawHeader(){
    let yh=10;
    if(logoBase64){ try{ doc.addImage(logoBase64,"JPEG",10,yh,45,14); }catch{} }
    doc.setFontSize(14); doc.setFont(undefined,'bold'); doc.setTextColor(0);
    doc.text("REPORTE DE VISITAS TECNICAS - ACUMULADO", 70, yh+5);
    doc.setFontSize(10); doc.setTextColor(30,64,175);
    doc.text(`Usuario: ${usuarioActual} | ${hist.length} visitas`, 195, yh+5, {align:"right"});
    doc.setFontSize(7); doc.setTextColor(100);
    doc.text(new Date().toLocaleString('es-EC'), 195, yh+9, {align:"right"});
    doc.setTextColor(0); doc.line(10,24,200,24);
    y=30;
  }

  drawHeader();
  doc.setFontSize(9); doc.setFont(undefined,'bold');
  doc.text(`Cliente: ${c.codigo} - ${c.nombre} | Fecha: ${$("vtFecha").value} | Total equipos: ${hist.length}`,10,y); y+=8;

  // TABLA RESUMEN
  const colW=[28,22,22,28,18,22,20,30];
  const headers=["SERIE","MODELO","BODEGA","SUCURSAL","CONT","TIPO","ESTADO","TRABAJO"];
  
  function drawTableHeader(yy){
    let x=10; doc.setFontSize(7); doc.setFont(undefined,'bold');
    headers.forEach((h,i)=>{ doc.setFillColor(230,230,230); doc.rect(x,yy,colW[i],7,"FD"); doc.text(h,x+1,yy+4.5); x+=colW[i]; });
    return yy+7;
  }
  y=drawTableHeader(y);
  
  hist.forEach(h=>{
    if(y>270){ doc.addPage(); drawHeader(); y=drawTableHeader(30); }
    let x=10; const vals=[h.serie,h.modelo,h.bodega||"",h.sede||"",h.contador,h.tipo||"",h.estado||"",h.trabajoNombre.substring(0,16)];
    doc.setFont(undefined,'normal'); doc.setFontSize(6.5);
    vals.forEach((v,i)=>{ doc.rect(x,y,colW[i],7); doc.text(String(v).substring(0,18),x+1,y+4.5); x+=colW[i]; });
    y+=7;
  });

  // DETALLE POR VISITA
  for(let idx=0; idx<hist.length; idx++){
    const h=hist[idx];
    doc.addPage(); drawHeader();
    doc.setFont(undefined,'bold'); doc.setFontSize(11);
    doc.text(`VISITA ${idx+1}/${hist.length} - ${h.serie} - ${h.modelo}`,10,y); y+=6;
    doc.setFontSize(8); doc.setFont(undefined,'normal');
    doc.text(`Sucursal: ${h.sede} | Area: ${h.ubicacion} | Contador: ${h.contador} | ${h.fecha} ${h.hora}`,10,y); y+=4;
    doc.text(`Trabajo: ${h.trabajoNombre} | Técnico: ${h.tecnicoNombre}`,10,y); y+=6;
    
    let det = doc.splitTextToSize(h.detalle||"(Sin detalle)",180);
    let alt = Math.max(15, det.length*4+6);
    if(y+alt>270){ doc.addPage(); drawHeader(); }
    doc.rect(10,y,180,alt); doc.text(det,12,y+5); y+=alt+8;

    // FOTOS 3x PAGINA (vertical centrada)
    const todasFotos = [...h.fotos, ...h.fotos2];
    if(todasFotos.length>0){
      // Si no entran, nueva pagina de fotos
      doc.addPage(); drawHeader();
      let yFoto=36;
      doc.setFont(undefined,'bold'); doc.setFontSize(11);
      doc.text(`EVIDENCIA ${h.serie} (${todasFotos.length} fotos) - 3 x PAG`,10,yFoto); yFoto+=8;
      
      for(let i=0; i<todasFotos.length; i+=3){
        if(i>0){ doc.addPage(); drawHeader(); yFoto=36; 
          doc.text(`EVIDENCIA ${h.serie} (cont.) Pag ${Math.floor(i/3)+1}/${Math.ceil(todasFotos.length/3)}`,10,yFoto); yFoto+=8;
        }
        const hasta=Math.min(i+3,todasFotos.length);
        for(let j=i;j<hasta;j++){
          const fotoW=180, fotoH=70;
          const x=(pageW-fotoW)/2;
          try{
            doc.addImage(todasFotos[j],"JPEG",x,yFoto,fotoW,fotoH);
            doc.rect(x,yFoto,fotoW,fotoH);
            doc.setFontSize(7); doc.text(`Foto ${j+1} - ${h.serie}`,x+2,yFoto+fotoH-2);
          }catch{}
          yFoto+=fotoH+8;
        }
      }
    }
  }

  // FIRMA FINAL - SOLO 1 VEZ AL FINAL
  doc.addPage(); drawHeader();
  y=50;
  doc.setFont(undefined,'bold'); doc.setFontSize(12);
  doc.text("FIRMA DE CONFORMIDAD FINAL - TODO EL SERVICIO",10,y); y+=10;
  doc.setFontSize(9); doc.setFont(undefined,'normal');
  doc.text(`Cliente: ${c.codigo} - ${c.nombre}`,10,y); y+=5;
  doc.text(`Total equipos atendidos: ${hist.length} | Fecha: ${$("vtFecha").value}`,10,y); y+=15;
  
  if(firmaData){
    try{ doc.addImage(firmaData,"PNG",10,y,90,35); }catch{}
    y+=40;
  }
  doc.line(10,y,100,y); y+=6;
  doc.text(firmaNombre,10,y); y+=5;
  doc.text(`CI/RUC: _______________________`,10,y);

  // footer en todas
  const totalPages=doc.internal.getNumberOfPages();
  for(let i=1;i<=totalPages;i++){
    doc.setPage(i);
    doc.setFontSize(6); doc.setTextColor(100);
    doc.text(`© 2026 DT - ${usuarioActual} - ${c.codigo} - ${hist.length} visitas - ${new Date().toLocaleString('es-EC')}`,105,290,{align:"center"});
  }

  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
  return doc;
}

function generarVisitaTXT(){
  const c=DB.clientes.find(x=>x.codigo===$("vtCliente")?.value);
  const p=DB.visitaPrinter;
  const t = DB.tecnicos.find(x=>x.codigo===$("vtTecnico")?.value) || {codigo:""};
  const tr = DB.trabajos.find(x=>x.codigo===$("vtTrabajo")?.value) || {codigo:""};
  const contador = $("vtContador")?.value || "0";
  if(!c||!p||!t||!tr)throw new Error("Falta cliente/impresora/tecnico/trabajo");
  return`${$("vtFecha").value};${$("vtHora").value};${c.codigo};${p.codigo};${p.serie};${p.sede};${p.ubicacion};${p.ip};${p.bodega};${contador};${t.codigo};${$("vtTipo").value};${tr.codigo};${$("vtEstado").value};${$("vtEmail")?.value||""};${$("vtNombreFirma")?.value||""};${($("vtDetalle").value||"").replace(/;/g,",").replace(/\n/g," ")}`;
}

function generarVisitaCON(){
  const c=selectedClientVisita(); 
  const p=DB.visitaPrinter;
  const t = DB.tecnicos.find(x=>x.codigo===$("vtTecnico")?.value) || {codigo:"", nombre:""};
  const tr = DB.trabajos.find(x=>x.codigo===$("vtTrabajo")?.value) || {codigo:"", nombre:""};
  
  if(!c) throw new Error("Seleccione cliente");
  if(!p) throw new Error("Seleccione impresora");
  if(!t) throw new Error("Seleccione técnico");
  if(!tr) throw new Error("Seleccione trabajo");

  return `ECOLOIMP S.A. - REPORTE DE VISITA TÉCNICA
═══════════════════════════════════════════════════════════════════

Estimado cliente,

Se ha realizado la visita técnica con el siguiente detalle:

📅 INFORMACIÓN DE VISITA
• Fecha: ${$("vtFecha").value} - ${$("vtHora").value}
• Tipo: ${$("vtTipo").value}
• Estado: ${$("vtEstado").value}

🏢 CLIENTE
• ${c.codigo} - ${c.nombre}

🖨️ EQUIPO ATENDIDO
• Código   : ${p.codigo}
• Modelo   : ${p.modelo}
• Serie    : ${p.serie}
• Sucursal : ${p.sede}
• Área     : ${p.ubicacion}
• Ubicación: ${p.ip}
• Bodega   : ${p.bodega}
• Contador : ${$("vtContador").value}

👨‍🔧 SERVICIO
• Técnico: ${t.nombre} (${t.codigo})
• Trabajo realizado: ${tr.nombre} (${tr.codigo})

📝 DETALLE DEL TRABAJO REALIZADO:
──────────────────────────────────────────────────────────────────────────
${justificar($("vtDetalle").value || "(Sin detalle registrado)", 106)}
──────────────────────────────────────────────────────────────────────────

✍️ CONFORMIDAD
• Firmado por: ${$("vtNombreFirma")?.value || "Cliente"}
• Firma digital: ${firmaDibujada ? "Sí, registrada en PDF" : "No registrada"}

Se adjuntan en la descarga automática:
• Reporte en PDF con firma
• Respaldo en TXT

Gracias por confiar en ECOLOIMP.

Atentamente,
Departamento Técnico
ECOLOIMP S.A.
${$("pgCorreo")?.value || gcorreo}
www.ecoloimp.com
`;
}
