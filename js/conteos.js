
function updateConteoPrinterTable(){
  const client=$("ctCliente")?.value;
  const q=norm($("ctPrinterFilter")?.value||"");
 // const rows=DB.impresoras.filter(p=>p.cliente===client&&norm([p.codigo,p.modelo,p.serie,p.sede,p.ubicacion].join(" ")).includes(q)); //
  const rows = DB.impresoras.filter(p=>p.cliente===client && norm([p.codigo,p.bodega,p.modelo,p.serie,p.sede,p.ubicacion,p.ip].join(" ")).includes(q));   
  const total=DB.impresoras.filter(p=>p.cliente===client).length;
  console.log("CONTEO cliente:",client,"total:",total,"mostrando:",rows.length);
  if($("conteoBody"))$("conteoBody").innerHTML=rows.length?rows.map(p=>`<tr data-serie="${esc(p.serie)}" data-codigo="${esc(p.codigo)}">
  <td>${esc(p.bodega)}</td>
  <td>${esc(p.modelo)}</td>
  <td>${esc(p.serie)}</td>
  <td>${esc(p.sede)}</td>
  <td>${esc(p.ubicacion)}</td>
  <td><input type="number" data-campo="negro" data-serie="${esc(p.serie)}" value="0" style="width:80px"></td>
  <td><input type="number" data-campo="color" data-serie="${esc(p.serie)}" value="0" style="width:80px"></td>
  <td><input type="number" data-campo="scan" data-serie="${esc(p.serie)}" value="0" style="width:80px"></td>
  <td><input type="number" data-campo="a3" data-serie="${esc(p.serie)}" value="0" style="width:80px"></td>
  </tr>`).join(""):`<tr><td colspan="8">${client?"Cliente sin impresoras - revisa impresoras.txt":"Seleccione cliente en Conteo"}</td></tr>`;
}

function updateConteo2PrinterTable(){
  const client = $("ct2Cliente")?.value;
  const q = norm($("ct2PrinterFilter")?.value||"");
  const rows = DB.impresoras.filter(p=>p.cliente===client && norm([p.codigo,p.modelo,p.serie,p.sede,p.ubicacion,p.ip,p.bodega].join(" ")).includes(q));
  const total = DB.impresoras.filter(p=>p.cliente===client).length;
  const selectedSerie = DB.conteo2Printer?.serie || "";
  const p = DB.conteo2Printer;
  const c = DB.clientes.find(x=>x.codigo===client);

  // Historial para marcar
  const historial = JSON.parse(localStorage.getItem("ecoloimp_conteo2")||"[]");
  const seriesContadas = new Set(historial.filter(h=>h.cliente===client).map(h=>h.serie));
  const contadasCount = seriesContadas.size;

  if($("ct2SelectedPrinterStatus")){
    $("ct2SelectedPrinterStatus").innerHTML = client ? 
      `Tiene ${total} | Mostrando ${rows.length} | Contadas: <b style="color:#16a34a">${contadasCount}/${total}</b> ${selectedSerie?` - Sel: ${selectedSerie}`:""}` 
      : "Ninguna impresora seleccionada";
  }
  
  if($("conteo2Body")){
    $("conteo2Body").innerHTML = rows.length ? rows.map(pr=>{
      const isSel = pr.serie === selectedSerie;
      const yaContada = seriesContadas.has(pr.serie);
      const hist = historial.find(h=>h.serie===pr.serie && h.cliente===client);
      
      let estilo = "";
      let btnTexto = "Seleccionar";
      let btnClase = "btn primary";
      
      if(yaContada){
        estilo = "background:#dcfce7 !important; border-left:4px solid #16a34a;";
        btnTexto = `✓ Ingresada`;   //`✓ ${hist?.negro||0}/${hist?.color||0}`;
        btnClase = "btn ghost";
        if(isSel) estilo = "background:#bbf7d0 !important;outline:2px solid #16a34a;";
      } else if(isSel){
        estilo = "background:#dbeafe;outline:2px solid #2563eb;";
        btnTexto = "✓ Seleccionada";
      }

      return `<tr class="${isSel?'selected':''}" style="${estilo}">
        <td><button class="${btnClase}" data-select-printer-c2="${esc(pr.serie)}" style="${yaContada?'color:#16a34a;font-weight:bold':''}">${btnTexto}</button></td>
        <td>${pr.bodega||''} ${yaContada?'<span style="color:#16a34a">✓</span>':''}</td>
        <td>${pr.codigo||''}</td><td>${pr.modelo||''}</td>
        <td><b>${pr.serie}</b></td>
        <td>${pr.sede||''}</td><td>${pr.ubicacion||''}</td><td>${pr.ip||''}</td>
      </tr>`;
    }).join("") : `<tr><td colspan="8">${client ? "Sin impresoras" : "Seleccione cliente"}</td></tr>`;
  }
        /* <td><b>${pr.serie}</b> ${yaContada?`<br><small style="color:#16a34a">N:${hist.negro} C:${hist.color} S:${hist.scan} A3:${hist.a3}</small>`:''}</td> */

  if($("ct2PrinterDetails")){
    if(p){
      const yaContada = seriesContadas.has(p.serie);
      const hist = historial.find(h=>h.serie===p.serie && h.cliente===client);
      
      $("ct2PrinterDetails").innerHTML = `
          <div><small>Código</small><strong>${esc(p.codigo)} ${yaContada?'✓ YA CONTADA':''}</strong></div>
          <div><small>Modelo</small><strong>${esc(p.modelo)}</strong></div>
          <div><small>Serie</small><strong>${esc(p.serie)}</strong></div>
          <div><small>Sucursal</small><strong>${esc(p.sede)}</strong></div>
          <div><small>Área</small><strong>${esc(p.ubicacion)}</strong></div>
          <div><small>Ubicación</small><strong>${esc(p.ip)}</strong></div>
          <div><small>Bodega</small><strong>${esc(p.bodega)}</strong></div>
          <div><small>Cliente</small><strong>${c ? esc(c.codigo) : "-"}</strong></div>
          <label><small>Negro</small><input type="number" id="ct2Negro" value="${yaContada?hist.negro:0}" style="width:100%;padding:8px;border:2px solid ${yaContada?'#16a34a':'#2563eb'};border-radius:6px"></label>
          <label><small>Color</small><input type="number" id="ct2Color" value="${yaContada?hist.color:0}" style="width:100%;padding:8px;border:2px solid ${yaContada?'#16a34a':'#2563eb'};border-radius:6px"></label>
          <label><small>Scanner</small><input type="number" id="ct2Scan" value="${yaContada?hist.scan:0}" style="width:100%;padding:8px;border:2px solid ${yaContada?'#16a34a':'#2563eb'};border-radius:6px"></label>
          <label><small>A3</small><input type="number" id="ct2A3" value="${yaContada?hist.a3:0}" style="width:100%;padding:8px;border:2px solid ${yaContada?'#16a34a':'#2563eb'};border-radius:6px"></label>
        ${yaContada?`<div style="background:#fef9c3;padding:8px;border-radius:6px;margin-top:8px;font-size:12px">⚠️ Ya contaste esta serie el ${hist.fecha}: N:${hist.negro} C:${hist.color} S:${hist.scan} A3:${hist.a3} - Si guardas se actualizará</div>`:''}
          <div style="margin-top:8px"><button class="btn primary" onclick="guardarConteo2()" style="background:${yaContada?'#16a34a':'#2563eb'}">${yaContada?'🔄 Actualizar Conteo':'💾 Guardar Conteo'} ${esc(p.serie)}</button></div>
      `;
    } else if(c){
      $("ct2PrinterDetails").innerHTML = `<div><small>Cliente seleccionado</small><strong>${esc(c.codigo+" · "+c.nombre)} - ${total} imp. | ${contadasCount} contadas - Seleccione una arriba</strong></div>`;
    }
  }
}

function generarConteoTXT(){
  const c = DB.clientes.find(x=>x.codigo===$("ctCliente")?.value);
  const t = DB.tecnicos.find(x=>x.codigo===$("ctTecnico")?.value) || {codigo:"", nombre:""};
  if(!c) throw new Error("Seleccione cliente conteo");
  
  const fecha = $("ctFecha")?.value || new Date().toISOString().slice(0,10);
  const tecnico = $("ctTecnico")?.value || "";
  
  let filas = [];
  document.querySelectorAll("#conteoBody tr[data-serie]").forEach(tr=>{
    const serie = tr.dataset.serie;
    const codImp = tr.dataset.codigo || "";
    const n  = tr.querySelector('[data-campo="negro"]')?.value||"0";
    const co = tr.querySelector('[data-campo="color"]')?.value||"0";
    const sc = tr.querySelector('[data-campo="scan"]')?.value||"0";
    const a3 = tr.querySelector('[data-campo="a3"]')?.value||"0";
    filas.push(`${c.codigo};${fecha};${t.codigo};${codImp};${serie};${n};${co};${sc};${a3}`);
  });

  if(filas.length === 0) throw new Error("Ingrese al menos un contador");
  
  return filas.join("\n");
}
  
function generarConteoCON(){
  const c=DB.clientes.find(x=>x.codigo===$("ctCliente")?.value);
  if(!c)throw new Error("Seleccione cliente conteo");
  const total=DB.impresoras.filter(x=>x.cliente===c.codigo).length;
  let filas=[];
  document.querySelectorAll("#conteoBody tr[data-serie]").forEach(tr=>{
    const serie=tr.dataset.serie;                                                                   
    const n=tr.querySelector('[data-campo="negro"]')?.value||"0";
    const co=tr.querySelector('[data-campo="color"]')?.value||"0";
    const sc=tr.querySelector('[data-campo="scan"]')?.value||"0";
    const a3=tr.querySelector('[data-campo="a3"]')?.value||"0";
    filas.push(`${c.codigo};${serie};${n};${co};${sc};${a3}`);});
  return`ECOLOIMP S.A. - CONTEO DE IMPRESIONES
  ════════════════════════════════
  
  Fecha   : ${$("ctFecha")?.value}
  Cliente : ${c.codigo} - ${c.nombre}
  Equipos : (${total} impresoras)
  
✍️ CONFORMIDAD
• Firmado por: ${$("ctNombreFirma")?.value || "Cliente"}
• Firma digital: ${firmaDibujadaCt ? "Sí, registrada en PDF" : "No registrada"}  

  Se adjuntan en la descarga automática:
• Reporte en PDF con firma
• Respaldo en TXT

Gracias por confiar en ECOLOIMP.

Atentamente,
Departamento Técnico
ECOLOIMP S.A.
${$("pgCorreo")?.value || gcorreo}
www.ecoloimp.com`
    ;}

// GRABA CONTEO DE IMPRESIONES
async function generarConteoPDF(){
  const fmtMiles = (n) => (parseInt(String(n).replace(/\./g,''))||0).toLocaleString('es-EC');
  const fmt = fmtMiles; // compatibilidad

  const clientCode = $("ctCliente")?.value;
  const c = DB.clientes.find(x=>x.codigo===clientCode);
  if(!c){ showMessage("ctMessage","Seleccione cliente",true); return; }
  
  let usuarioActual = localStorage.getItem('ecoloimp_session') || 'Invitado';
  const datos = Array.from(document.querySelectorAll("#conteoBody input[data-campo]")).reduce((acc, inp)=>{
    const serie = inp.dataset.serie;
    if(!acc[serie]) acc[serie] = {negro:0,color:0,scan:0,a3:0};
    acc[serie][inp.dataset.campo] = parseInt(inp.value)||0;
    return acc;
  },{});

  const impresorasConteo = Object.keys(datos);
  if(impresorasConteo.length===0){ showMessage("ctMessage","No hay impresoras para este cliente",true); return; }
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({orientation:"portrait", unit:"mm", format:"a4"});
  const logoBase64 = await getLogoBase64().catch(()=>null);
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  function drawHeader(){
    doc.setFillColor(255,255,255);
    doc.rect(0,0,pageW,30,"F");
    
    if(logoBase64){
      try{
        let props = doc.getImageProperties(logoBase64);
        let w = 45; 
        let h = (props.height * w) / props.width;
        if(h > 18) { h = 18; w = (props.width * h) / props.height; }
        doc.addImage(logoBase64,"JPEG",10,4, w, h);
      }catch(e){ 
        try{ doc.addImage(logoBase64,"JPEG",10,4,45,15); }catch{} 
      }
    }

    doc.setTextColor(0,0,0);
    doc.setFontSize(14); 
    doc.setFont(undefined,'bold');
    doc.text("CONTEO DE IMPRESIONES", pageW/2, 12, {align:"center"});

    doc.setFontSize(8); 
    doc.setTextColor(30,64,175);
    doc.text(`Usuario: ${usuarioActual}`, pageW-10, 10, {align:"right"});

    doc.setFont(undefined,'normal');
    doc.setTextColor(100);
    doc.setFontSize(7);
    doc.text(new Date().toLocaleString('es-EC'), pageW-10, 14, {align:"right"});
    
    let yInfo = 22;
    doc.setTextColor(0,0,0);
    doc.setFontSize(9);
    doc.setFont(undefined,'bold'); doc.text("Cliente:", 10, yInfo);
    doc.setFont(undefined,'normal'); doc.text(`${c.codigo} - ${c.nombre.substring(0,60)}`, 26, yInfo);
    yInfo+=5;
    doc.setFont(undefined,'bold'); doc.text("Fecha:", 10, yInfo);
    doc.setFont(undefined,'normal'); doc.text(`${$("ctFecha")?.value||""} ${$("ctHora")?.value||""}`, 26, yInfo);
    yInfo+=5;
    doc.setFont(undefined,'bold'); doc.text("Equipos:", 10, yInfo);
    doc.setFont(undefined,'normal'); doc.text(`${impresorasConteo.length} impresoras`, 26, yInfo);
  }

  drawHeader();
  let y = 36;
  const colW = [12, 32, 26, 32, 32, 14, 14, 14, 14]; // SUMA = 190 - CUADRA PERFECTO EN A4 (10mm margen izq + 10 der)
  const headers = ["ETQ","MODELO","SERIE","SUCURSAL","AREA","NEGRO","COLOR","SCAN","A3"];
  const tableW = colW.reduce((a,b)=>a+b,0);

  function drawTableHeader(yy){
    let x=10;
    doc.setFont(undefined,'bold'); 
    doc.setFontSize(7.5);
    doc.setDrawColor(0,0,0);
    doc.setTextColor(0,0,0);
    headers.forEach((h,i)=>{
      doc.setFillColor(230,230,230); // gris clarito para que se vea cuadrado
      doc.rect(x,yy,colW[i],7,"FD");
      doc.text(h, x+colW[i]/2, yy+4.5, {align:"center"});
      x+=colW[i];
    });
    doc.setFont(undefined,'normal');
    return yy+7;
  }
  
  y = drawTableHeader(y);

  const rows = impresorasConteo.map(serie=>{
    const p = DB.impresoras.find(x=>x.serie===serie) || {};
    return [
      (p.bodega||""),
      (p.modelo||""),
      serie,
      (p.sede||""),
      (p.ubicacion||""),
      fmtMiles(datos[serie].negro),
      fmtMiles(datos[serie].color),
      fmtMiles(datos[serie].scan),
      fmtMiles(datos[serie].a3)
    ];
  });

  rows.forEach((r)=>{
    doc.setFontSize(7);
    const areaLines = doc.splitTextToSize(r[4], colW[4]-2);
    const rowH = Math.max(6, areaLines.length * 3.5 + 2.5);

    if(y + rowH > pageH-28){ doc.addPage(); drawHeader(); y=36; y=drawTableHeader(y); }

    let x=10;
    doc.setDrawColor(180,180,180); 
    doc.setTextColor(0,0,0);
    r.forEach((val,i)=>{
      doc.setFillColor(255,255,255);
      doc.rect(x,y,colW[i],rowH,"FD");
      if(i===4){
        doc.text(areaLines, x+1, y+3.5);
      } else if(i>=5){
        // FIX CUADRE: derecha real
        doc.text(String(val), x+colW[i]-1, y+4, {align:"right"});
      } else {
        doc.text(String(val).substring(0,20), x+1, y+4, {align:"left"});
      }
      x+=colW[i];
    });
    y+=rowH;
  });

  // Totales
  if(y > pageH-35){ doc.addPage(); drawHeader(); y=38; }
  const totRaw = impresorasConteo.reduce((a,s)=>({
    n:a.n+datos[s].negro, c:a.c+datos[s].color,
    s:a.s+datos[s].scan, a3:a.a3+datos[s].a3
  }), {n:0,c:0,s:0,a3:0});
 
  //doc.setFillColor(240,240,240);
  //doc.setDrawColor(0,0,0);
  //doc.setTextColor(0,0,0);
  //doc.setFont(undefined,'bold');
  //doc.setFontSize(8);
  //doc.rect(10,y,tableW,7,"FD");
  //doc.text(`TOT: N:${fmt(totRaw.n)} | C:${fmt(totRaw.c)} | S:${fmt(totRaw.s)} | A3:${fmt(totRaw.a3)} | EQ:${rows.length}`, 12, y+4.5);
  y+=12;

  // Firma
  doc.setFont(undefined,'bold'); doc.setFontSize(9);
  doc.text("FIRMA DE CONFORMIDAD", 10, y); 
  y+=2;
  const firmaData = (()=>{ try{ return (typeof firmaDibujadaCt!== 'undefined' && firmaDibujadaCt)? $("ctFirmaCanvas").toDataURL("image/png"):null;}catch{return null;} })();
  if(firmaData) try{ doc.addImage(firmaData,"PNG",10,y,50,14); }catch{}
  y+=14;
  doc.setDrawColor(0,0,0); doc.line(10,y,65,y);
  y+=4;
  doc.setFontSize(8); doc.setFont(undefined,'normal');
  doc.text($("ctNombreFirma")?.value||"Firma Cliente", 12, y);

   // FOTOS CONTEO - GRID 3x3 CORRECTO
   y+=8;
const listaFotos = FOTOS_DB.fotosConteo;
  if(listaFotos.length>0){
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    if(y > 150){ doc.addPage(); drawHeader(); y=36; }

    doc.setFont(undefined,'bold'); doc.setFontSize(10); doc.setTextColor(0);
    doc.text("EVIDENCIA FOTOGRAFICA:", 10, y); y+=8;

    const fotosPorFila = 2;
    const fotosPorPagina = 8; // 2x4
    const fotoW = 86;
    const fotoH = 48;
    const gapX = 8;
    const gapY = 7;

    let x=10;
    let countFila=0;
    let countPagina=0;

    for(let i=0;i<listaFotos.length;i++){
      // nueva fila (2 fotos)
      if(countFila >= fotosPorFila){
        x=10;
        y+= fotoH + gapY;
        countFila=0;
         if(y > 150){ doc.addPage(); drawHeader(); y=36; countPagina=0;}           
      }
      // nueva pagina (8 fotos)
      if(countPagina >= fotosPorPagina){
        if(y > 150){ doc.addPage(); drawHeader(); y=36; countFila=0; countPagina=0;}     
        doc.setFont(undefined,'bold'); doc.setFontSize(10);
        doc.text("EVIDENCIA FOTOGRAFICA: (cont.)", 10, y); y+=8;
        x=10;
      }

      try{
        doc.addImage(listaFotos[i],"JPEG", x, y, fotoW, fotoH);
        doc.setDrawColor(180); doc.setLineWidth(0.2); doc.rect(x,y,fotoW,fotoH);
        doc.setFontSize(7); doc.text(`Foto ${i+1}`, x+2, y+fotoH-2);
      }catch(e){}

      x+= fotoW + gapX;
      countFila++;
      countPagina++;
    }
    y+= fotoH + 12;
  }
  const totalPages = doc.internal.getNumberOfPages();
  for(let i=1; i<=totalPages; i++){
    doc.setPage(i);
    doc.setFontSize(6); doc.setTextColor(100);
    doc.setDrawColor(180); doc.line(10, pageH-10, pageW-10, pageH-10);
    doc.text(`© 2026 DT Soluciones Informaticas - ECOLOIMP Web`, 10, pageH-5);
    doc.text(`Pag ${i}/${totalPages}`, pageW-10, pageH-5, {align:"right"});
  }
  return doc;
}

function generarConteo2TXT(){
  const historial = JSON.parse(localStorage.getItem("ecoloimp_conteo2")||"[]");
  if(historial.length===0) throw new Error("No hay conteos en Conteo2 - guarde al menos uno");
  // cliente;fecha;tecnico;codImp;serie;negro;color;scan;a3
  const tecnico = $("ct2Tecnico")?.value || "";
  return historial.map(h=>`${h.cliente};${h.fecha};${tecnico};${h.codigo};${h.serie};${h.negro};${h.color};${h.scan};${h.a3}`).join("\n");
}

async function generarConteo2PDF(){
  const historial = JSON.parse(localStorage.getItem("ecoloimp_conteo2")||"[]");
  if(historial.length===0){ alert("No hay conteos guardados en Conteo2"); return; }

  const clientCode = $("ct2Cliente")?.value || historial[0].cliente;
  const c = DB.clientes.find(x=>x.codigo===clientCode) || {codigo:clientCode, nombre:clientCode};
  const usuarioActual = localStorage.getItem('ecoloimp_session') || 'Invitado';
  const logoBase64 = await getLogoBase64().catch(()=>null);
  
  let filas = historial.map(h=>{
    const p = DB.impresoras.find(x=>x.serie===h.serie) || {};
    return { ...h, modelo: p.modelo||"", sucursal: p.sede||"SIN SUCURSAL", area: p.ubicacion||"SIN AREA", bodega: p.bodega||"" };
  });

  filas.sort((a,b)=>{
    const s = a.sucursal.localeCompare(b.sucursal,'es');
    if(s!==0) return s;
    const ar = a.area.localeCompare(b.area,'es');
    if(ar!==0) return ar;
    return a.serie.localeCompare(b.serie);
  });

  const grupos = {};
  filas.forEach(f=>{
    const key = f.sucursal;
    if(!grupos[key]) grupos[key]=[];
    grupos[key].push(f);
  });

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({orientation:"portrait", unit:"mm", format:"a4"});
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = 30;

  function drawHeader(){
    let yh = 10;
    if(logoBase64){
      try{
        let props = doc.getImageProperties(logoBase64);
        let w = 45; let h = (props.height * w) / props.width;
        if(h > 14) { h = 14; w = (props.width * h) / props.height; }
        doc.addImage(logoBase64,"JPEG",10,yh, w, h);
      }catch(e){ try{ doc.addImage(logoBase64,"JPEG",10,yh,45,14); }catch{} }
    }
    doc.setFontSize(14); doc.setFont(undefined,'bold'); doc.setTextColor(0);
    doc.text("CONTEO DE IMPRESIONES - CONTEO 2", 70, yh+5);
    doc.setFont(undefined,'bold'); doc.setFontSize(10); doc.setTextColor(30,64,175);
    doc.text(`Usuario: ${usuarioActual}`, 195, yh+5, {align:"right"});
    doc.setFont(undefined,'normal'); doc.setFontSize(7); doc.setTextColor(100);
    doc.text(new Date().toLocaleString('es-EC'), 195, yh+9, {align:"right"});
    doc.setTextColor(0); doc.setLineWidth(0.6); doc.setDrawColor(15,23,42);
    doc.line(10, 24, 200, 24);
    y = 30;
  }

  drawHeader();
  doc.setFontSize(9); doc.setFont(undefined,'bold');
  doc.text(`Cliente: ${c.codigo} - ${c.nombre.substring(0,60)}`, 10, y); y+=5;
  doc.setFont(undefined,'normal'); doc.setFontSize(8);
  doc.text(`Fecha: ${$("ct2Fecha")?.value || new Date().toISOString().slice(0,10)} | Equipos: ${filas.length}`, 10, y); y+=8;

  const colW = [12, 28, 26, 30, 30, 16, 16, 16, 16];
  const headers = ["ETQ","MODELO","SERIE","SUCURSAL","AREA","NEGRO","COLOR","SCAN","A3"];
  const tableW = colW.reduce((a,b)=>a+b,0);

  function drawTableHeader(yy){
    let x=10; doc.setFont(undefined,'bold'); doc.setFontSize(7.5); doc.setDrawColor(0);
    headers.forEach((h,i)=>{
      doc.setFillColor(230,230,230); doc.rect(x,yy,colW[i],7,"FD");
      doc.text(h, x+colW[i]/2, yy+4.5, {align:"center"}); x+=colW[i];
    });
    doc.setFont(undefined,'normal'); return yy+7;
  }

  Object.keys(grupos).sort((a,b)=>a.localeCompare(b,'es')).forEach(sucursal=>{
    const lista = grupos[sucursal];
    if(y > pageH-30){ doc.addPage(); drawHeader(); y=36; }
    doc.setFillColor(15,23,42); doc.setTextColor(255); doc.setFont(undefined,'bold'); doc.setFontSize(8);
    doc.rect(10, y, tableW, 7, "F");
    doc.text(`SUCURSAL: ${sucursal} (${lista.length} eq.)`, 12, y+4.5);
    doc.setTextColor(0); y+=7;
    y = drawTableHeader(y);
    lista.forEach(f=>{
      const rowH = 7;
      if(y + rowH > pageH-28){
        doc.addPage(); drawHeader(); y=36;
        doc.setFillColor(15,23,42); doc.setTextColor(255); doc.rect(10,y,tableW,7,"F");
        doc.text(`SUCURSAL: ${sucursal} (cont.)`,12,y+4.5); doc.setTextColor(0); y+=7;
        y=drawTableHeader(y);
      }
      let x=10;
      const vals = [f.bodega||"", (f.modelo||"").substring(0,16), f.serie, (f.sucursal||"").substring(0,18), (f.area||"").substring(0,18), fmtMiles(f.negro), fmtMiles(f.color), fmtMiles(f.scan), fmtMiles(f.a3)];
      doc.setFontSize(7); doc.setDrawColor(180);
      vals.forEach((val,i)=>{
        doc.setFillColor(255,255,255); doc.rect(x,y,colW[i],rowH,"FD");
        if(i>=5) doc.text(val, x+colW[i]-1, y+4, {align:"right"});
        else doc.text(val, x+1, y+4);
        x+=colW[i];
      });
      y+=rowH;
    });
    y+=4;
  });

  if(y > pageH-30){ doc.addPage(); drawHeader(); y=36; }
  //const tot = filas.reduce((a,f)=>({n:a.n+Number(f.negro||0), c:a.c+Number(f.color||0), s:a.s+Number(f.scan||0), a3:a.a3+Number(f.a3||0)}),{n:0,c:0,s:0,a3:0});
  //doc.setFillColor(240,240,240); doc.setDrawColor(0); doc.setFont(undefined,'bold'); doc.setFontSize(8);
  //doc.rect(10,y,tableW,7,"FD");
  //doc.text(`TOTAL PAGINAS: NEGRO:${tot.n.toLocaleString('es-EC')}      |      COLOR:${tot.c.toLocaleString('es-EC')}     |      ESCANEADAS:${tot.s.toLocaleString('es-EC')}      |      A3:${tot.a3.toLocaleString('es-EC')}      |      EQUIPOS:${filas.length}`,12,y+4.5);
  y+=12;

  doc.setFont(undefined,'bold'); doc.setFontSize(9);
  doc.text("FIRMA DE CONFORMIDAD", 10, y); y+=2;
  const firmaData = (()=>{ try{ return $("ct2FirmaCanvas")?.toDataURL("image/png"); }catch{return null;} })();
  if(firmaData && firmaData.length>100) try{ doc.addImage(firmaData,"PNG",10,y,50,14); }catch{}
  y+=14; doc.setDrawColor(0); doc.line(10,y,65,y); y+=4;
  doc.setFontSize(8); doc.setFont(undefined,'normal');
  doc.text($("ct2NombreFirma")?.value||"Firma Cliente",12,y);

  // FOTOS 1 X PAGINA = 180 x 135 mm
  const listaFotos = (typeof fotosConteo2!=="undefined" ? fotosConteo2 : []);
  if(listaFotos && listaFotos.length>0){
    for(let i=0;i<listaFotos.length;i++){
      doc.addPage();
      drawHeader();
      let yFoto = 35;
      doc.setFont(undefined,'bold'); doc.setFontSize(11); doc.setTextColor(0);
      doc.text(`EVIDENCIA FOTOGRAFICA ${i+1}/${listaFotos.length}`, 10, yFoto); yFoto+=5;
      doc.setFontSize(8); doc.setFont(undefined,'normal'); doc.setTextColor(100);
      const infoFoto = filas[i] ? `${filas[i].serie} - ${filas[i].sucursal} - ${filas[i].area}` : "";
      doc.text(infoFoto, 10, yFoto); yFoto+=7;

      const fotoW = 180;
      const fotoH = 135;
      const xFoto = (pageW - fotoW)/2;
      try{
        doc.addImage(listaFotos[i], "JPEG", xFoto, yFoto, fotoW, fotoH);
        doc.setDrawColor(150); doc.setLineWidth(0.3); doc.rect(xFoto, yFoto, fotoW, fotoH);
      }catch(e){}
      doc.setFontSize(7); doc.text(`Foto ${i+1}`, xFoto, yFoto+fotoH+5);
    }
  }

  const totalPages = doc.internal.getNumberOfPages();
  for(let i=1;i<=totalPages;i++){
    doc.setPage(i);
    doc.setFontSize(6); doc.setTextColor(100); doc.setDrawColor(180);
    doc.line(10,pageH-10,pageW-10,pageH-10);
    doc.text(`© 2026 DT Soluciones - ECOLOIMP Web | ${usuarioActual} - ${new Date().toLocaleString('es-EC')} | ${c.codigo}`,10,pageH-5);
    doc.text(`Pag ${i}/${totalPages}`,pageW-10,pageH-5,{align:"right"});
  }

  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
  return doc;
}  
