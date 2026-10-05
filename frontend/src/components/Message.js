"use client";

export default function Message({ mensaje, esPropio, esGrupo }) {
  const hora = new Date(mensaje.fecha_envio).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <div className={`message ${esPropio ? "sent" : "received"}`}>
      {esGrupo && !esPropio && (
        <div className="message-sender">{mensaje.remitente_nombre}</div>
      )}
      <div className="message-content">{mensaje.contenido}</div>
      <div className="message-time">{hora}</div>
    </div>
  );
}
