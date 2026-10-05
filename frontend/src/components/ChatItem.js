"use client";

export default function ChatItem({ chat, onClick, active }) {
  const inicial = chat.nombre ? chat.nombre.charAt(0).toUpperCase() : "?";
  const horaUltimo = chat.ultimo_mensaje
    ? new Date(chat.ultimo_mensaje.fecha_envio).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit"
      })
    : "";
  const textoUltimo = chat.ultimo_mensaje
    ? chat.ultimo_mensaje.contenido
    : "Sin mensajes";

  return (
    <div className={`chat-item ${active ? "active" : ""}`} onClick={onClick}>
      <div className="avatar">
        {chat.foto ? <img src={chat.foto} alt={chat.nombre} /> : inicial}
      </div>
      <div className="chat-item-info">
        <div className="chat-item-top">
          <span className="chat-item-name">{chat.nombre}</span>
          <span className="chat-item-time">{horaUltimo}</span>
        </div>
        <div className="chat-item-lastmsg">{textoUltimo}</div>
      </div>
    </div>
  );
}
