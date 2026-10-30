
// GRABA INVENTARIOS
async function generarInvPDF(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p','mm','a4');
  const logoBase64 = await getLogoBase64().catch(()=>null);
  const usuarioActual = localStorage.getItem('ecoloimp_session') || 'Invitado';
  const clienteCode = $("ivCliente")?.value || "";
  const clienteObj = DB.clientes.find(x=>x.codigo===clienteCode);

let filas = [];
  // 1. PRIMERO intenta leer del DETALLE (lo que agregaste con btnAgregarProducto)
const filaEncabezado = document.querySelector('#inventarioHead tr');
  Array.from(filaEncabezado.cells).forEach((columna, index) => {
    console.log(`Nombre de la columna ${index + 1}:`, columna.textContent.trim());
});
  const detalleRows = document.querySelectorAll("#inventarioBody tr");

  //$("inventarioBody").innerHTML = invRows.length? invRows.map(i=>{
  //    const codigo = (i.codigo||"").trim();
  //    const prod = DB.productos.find(p=> (p.codigo||"").trim() === codigo);
  //    const alterno = esc(prod?.alterno || i.alterno || i.nombre || "");
  //    const nombreReal = esc(prod?.nombre || i.nombre || "");

  //    return `
  
  if(detalleRows.length>0){

    detalleRows.forEach(tr=>{
      detalleRows.push({
        bodega: tr.bodega || "",
        codigo: tr.codigo || "",
        alterno: tr.dataset.alterno || "",
        nombre: tr.dataset.nombre || "",
        saldo: Number(tr.dataset.saldo||0),
        conteo: Number(tr.querySelector("input.det-cant")?.value||0)
      });
    });
  }else{
      alert("inv");
    // 2. Si no hay detalle, lee directo del inventario
    document.querySelectorAll("#inventarioBody tr").forEach(tr=>{
      const inp = tr.querySelector("input[data-inv-codigo]");
      if(!inp || Number(inp.value||0)<=0) return;
      filas.push({
        bodega: inp.dataset.invBodega,
        codigo: inp.dataset.invCodigo,
        alterno: inp.dataset.invAlterno,
        nombre: inp.dataset.invNombre,
        saldo: Number(inp.dataset.invSaldo||0),
        conteo: Number(inp.value||0)
      });
    });
  }
  if(filas.length===0){ alert("No hay conteo para PDF - agregue productos primero"); return; }

  const grupos = {};
  filas.forEach(f=>{ if(!grupos[f.bodega]) grupos[f.bodega]=[]; grupos[f.bodega].push(f); });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  function drawHeader(){
    doc.setFillColor(255,255,255); doc.rect(0,0,pageW,30,"F");
    if(logoBase64){
      try{
        let props = doc.getImageProperties(logoBase64);
        let w=45; let h=(props.height*w)/props.width; if(h>18){h=18; w=(props.width*h)/props.height;}
        doc.addImage(logoBase64,"JPEG",10,4,w,h);
      }catch(e){ try{doc.addImage(logoBase64,"JPEG",10,4,45,15);}catch{} }
    }
    doc.setTextColor(0); doc.setFontSize(14); doc.setFont(undefined,'bold');
    doc.text("TOMA DE INVENTARIO", pageW/2, 12, {align:"center"});
    doc.setFontSize(8); doc.setTextColor(30,64,175);
    doc.text(`Usuario: ${usuarioActual}`, pageW-10, 10, {align:"right"});
    doc.setFont(undefined,'normal'); doc.setTextColor(100); doc.setFontSize(7);
    doc.text(new Date().toLocaleString('es-EC'), pageW-10, 14, {align:"right"});
    let yInfo=22; doc.setTextColor(0); doc.setFontSize(9);
    doc.setFont(undefined,'bold'); doc.text("Cliente:",10,yInfo);
    doc.setFont(undefined,'normal'); doc.text(`${clienteCode} - ${(clienteObj?.nombre||"").substring(0,60)}`,26,yInfo);
    yInfo+=5;
    doc.setFont(undefined,'bold'); doc.text("Bodegas:",10,yInfo);
    doc.setFont(undefined,'normal'); doc.text(`${Object.keys(grupos).join(", ")}`,26,yInfo);
  }

  drawHeader();
  let y=36;
  const colW=[18,22,58,20,20,20];
  const headers=["CODIGO","ALTERNO","NOMBRE PRODUCTO","SALDO","CONTEO","DIF."];
  const tableW=colW.reduce((a,b)=>a+b,0);

  function drawTableHeader(yy){
    let x=10; doc.setFont(undefined,'bold'); doc.setFontSize(7.5); doc.setDrawColor(0);
    headers.forEach((h,i)=>{
      doc.setFillColor(15,23,42); doc.setTextColor(255);
      doc.rect(x,yy,colW[i],7,"F"); doc.rect(x,yy,colW[i],7,"D");
      doc.text(h, x+colW[i]/2, yy+4.5, {align:"center"}); x+=colW[i];
    });
    doc.setTextColor(0); doc.setFont(undefined,'normal'); return yy+7;
  }
  //y=drawTableHeader(y);

  Object.keys(grupos).sort().forEach(codBodega=>{
    const bodegaInfo = DB.bodegas.find(b=> b.codigo===codBodega);
    const nombreBodega = bodegaInfo? `${bodegaInfo.codigo} - ${bodegaInfo.nombre}` : codBodega;
    if(y > pageH-35){ doc.addPage(); drawHeader(); y=36; y=drawTableHeader(y); }
    doc.setFillColor(241,245,249); doc.setDrawColor(0); doc.setFont(undefined,'bold'); doc.setFontSize(8);
    doc.rect(10,y,tableW,7,"FD");
    doc.text(`Bodega: ${nombreBodega}`,12,y+5);
    y+=7; 
    y=drawTableHeader(y);
    grupos[codBodega].forEach(f=>{
      const dif = f.conteo - f.saldo;
      const rowH=7;
      if(y+rowH > pageH-25){ doc.addPage(); drawHeader(); y=36; y=drawTableHeader(y);
        doc.setFillColor(241,245,249); doc.rect(10,y,tableW,7,"FD"); doc.setFont(undefined,'bold'); doc.text(`Bodega: ${nombreBodega} (cont.)`,12,y+5); y+=7; y=drawTableHeader(y);
      }
      
      const codigo = (f.codigo || "").toString();
      const alterno = (f.alterno || "").toString();
      const nombre = (f.nombre || "").toString().substring(0,42);
      const vals=[codigo, alterno, nombre, String(f.saldo), String(f.conteo), dif>0?`+${dif}`:`${dif}`];
      let x=10; doc.setFont(undefined,'normal'); doc.setFontSize(7); doc.setTextColor(0);
      vals.forEach((val,i)=>{
        let fill=[255,255,255];
        if(i===4) fill=[255,255,200];
        if(i===5){
          const v=Number(String(val).replace("+",""));
          if(v<0) fill=[254,226,226];
          if(v>0) fill=[220,252,231];
        }
        doc.setFillColor(...fill); doc.rect(x,y,colW[i],rowH,"FD");
        if(i===2) doc.text(String(val),x+1,y+4);
        else doc.text(String(val),x+colW[i]/2,y+4,{align:"center"});
        x+=colW[i];
      });
      y+=rowH;
    });
    y+=3;
  });

  // Totales
  if(y > pageH-35){ doc.addPage(); drawHeader(); y=38; }
  const tot = filas.reduce((a,f)=>({s:a.s+f.saldo, c:a.c+f.conteo, d:a.d+(f.conteo-f.saldo)}),{s:0,c:0,d:0});
  doc.setFillColor(240,240,240); doc.setDrawColor(0); doc.setFont(undefined,'bold'); doc.setFontSize(8);
  doc.rect(10,y,tableW,7,"FD");
  doc.text(`TOTAL: Saldo:${tot.s} | Conteo:${tot.c} | Dif:${tot.d>0?`+${tot.d}`:tot.d} | Items:${filas.length}`,12,y+4.5);
  y+=12;

  // Firma como en conteos
  doc.setFont(undefined,'bold'); doc.setFontSize(9);
  doc.text("FIRMA DE CONFORMIDAD", 10, y); y+=2;
  const firmaData = (()=>{ try{ return $("ivFirmaCanvas")?.toDataURL("image/png"); }catch{return null;} })();
  if(firmaData && firmaData.length>100) try{ doc.addImage(firmaData,"PNG",10,y,50,14); }catch{}
  y+=14; doc.setDrawColor(0); doc.line(10,y,65,y); y+=4;
  doc.setFontSize(8); doc.setFont(undefined,'normal');
  doc.text($("ivNombreFirma")?.value||"Firma Cliente",12,y);

  const totalPages=doc.internal.getNumberOfPages();
  for(let i=1;i<=totalPages;i++){
    doc.setPage(i);
    doc.setFontSize(6); doc.setTextColor(100); doc.setDrawColor(180);
    doc.line(10,pageH-10,pageW-10,pageH-10);
    doc.text(`© 2026 DT Soluciones - Generado por ${usuarioActual} - ${new Date().toLocaleString('es-EC')}`,10,pageH-5);
    doc.text(`Pag ${i}/${totalPages}`,pageW-10,pageH-5,{align:"right"});
  }

  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
  return doc;
}

