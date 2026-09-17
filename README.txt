ECOLOIMP - SISTEMA WEB

VERSION JS - SIN PHP

Este proyecto funciona como una aplicación web estática con HTML, CSS y JavaScript.

ENVÍO POR GMAIL
Cada opción genera un archivo TXT desde JavaScript y luego abre la ventana de redacción de Gmail con destinatario, asunto y toda la información del reporte.

IMPORTANTE:
Por seguridad, JavaScript ejecutado en el navegador NO puede adjuntar automáticamente un archivo local a Gmail ni enviar un correo directamente usando la contraseña de Gmail. Por eso el flujo es:
1. Se genera y guarda el TXT.
2. Se abre Gmail con los datos cargados.
3. El usuario adjunta el TXT guardado y pulsa Enviar.

Si se requiere envío 100%% automático con archivo adjunto, se necesita un servicio autorizado como Gmail API con OAuth o un servidor/backend.

DATOS
Los archivos TXT se encuentran en data/.
