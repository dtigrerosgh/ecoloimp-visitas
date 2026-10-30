
  

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

