"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import Button from "@/components/Button";
import Input from "@/components/Input";
import ChatList from "@/components/ChatList";
import Message from "@/components/Message";
import useSocket from "@/hooks/useSocket";

const BACKEND = "http://localhost:4000";
const FOTO_DEFAULT_USUARIO = "/usuarios/default.svg";
const FOTO_DEFAULT_GRUPO = "/grupos/default.svg";

export default function ChatPage() {
  const router = useRouter();
  const { socket, conectado } = useSocket();
  const [usuario, setUsuario] = useState(null);

  const [chats, setChats] = useState([]);
  const [chatActivo, setChatActivo] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [textoMensaje, setTextoMensaje] = useState("");

  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevoError, setNuevoError] = useState("");

  const [grupoNombre, setGrupoNombre] = useState("");
  const [grupoEmails, setGrupoEmails] = useState([]);
  const [grupoEmailInput, setGrupoEmailInput] = useState("");
  const [grupoFoto, setGrupoFoto] = useState(null);
  const [grupoFotoVista, setGrupoFotoVista] = useState(null);
  const [grupoError, setGrupoError] = useState("");

  const [popupNuevoChat, setPopupNuevoChat] = useState(false);
  const [popupNuevoGrupo, setPopupNuevoGrupo] = useState(false);

  const mensajesRef = useRef(null);
  const chatActivoIdRef = useRef(null);

  useEffect(() => {
    const guardado = localStorage.getItem("piochat_usuario");
    if (guardado) {
      try {
        const usu = JSON.parse(guardado);
        setUsuario(usu);
      } catch (e) {
        router.replace("/login");
      }
    } else {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    if (usuario) {
      cargarChats();
    }
  }, [usuario]);

  useEffect(() => {
    chatActivoIdRef.current = chatActivo ? chatActivo.id : null;
  }, [chatActivo]);

  useEffect(() => {
    if (!socket) return;

    const handler = (mensajeNuevo) => {
      if (chatActivoIdRef.current === mensajeNuevo.chat_id) {
        setMensajes((prev) => [...prev, mensajeNuevo]);
      }
      cargarChats();
    };

    socket.on("nuevo_mensaje", handler);
    return () => {
      socket.off("nuevo_mensaje", handler);
    };
  }, [socket]);

  useEffect(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
    }
  }, [mensajes]);

  const cerrarSesion = () => {
    localStorage.removeItem("piochat_usuario");
    router.replace("/login");
  };

  const cargarChats = async () => {
    if (!usuario) return;
    try {
      const resp = await fetch(BACKEND + "/chats/" + usuario.id);
      const data = await resp.json();
      if (resp.ok) {
        setChats(data);
      }
    } catch (err) {}
  };

  const seleccionarChat = async (chat) => {
    if (socket && chatActivo) {
      socket.emit("leave_chat", chatActivo.id);
    }
    setChatActivo(chat);
    chatActivoIdRef.current = chat.id;
    try {
      const resp = await fetch(BACKEND + "/chats/" + chat.id + "/mensajes");
      const data = await resp.json();
      if (resp.ok) {
        setMensajes(data);
      }
    } catch (err) {
      setMensajes([]);
    }
    if (socket) {
      socket.emit("join_chat", chat.id);
    }
  };

  const enviarMensaje = (e) => {
    e.preventDefault();
    if (!textoMensaje.trim() || !chatActivo || !socket || !usuario) return;
    socket.emit("enviar_mensaje", {
      chat_id: chatActivo.id,
      usuario_id: usuario.id,
      contenido: textoMensaje.trim()
    });
    setTextoMensaje("");
  };

  const crearNuevoChat = async (close) => {
    setNuevoError("");
    if (!nuevoEmail.trim()) {
      setNuevoError("Ingresa un email");
      return;
    }
    try {
      const resp = await fetch(BACKEND + "/chats/nuevo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId: usuario.id, emailOtro: nuevoEmail.trim() })
      });
      const data = await resp.json();
      if (!resp.ok) {
        setNuevoError(data.error || "Error al crear el chat");
        return;
      }
      setNuevoEmail("");
      close();
      await cargarChats();
      setTimeout(async () => {
        const resp2 = await fetch(BACKEND + "/chats/" + usuario.id);
        const lista = await resp2.json();
        const elChat = lista.find((c) => c.id === data.chatId);
        if (elChat) {
          await seleccionarChat(elChat);
        }
      }, 200);
    } catch (err) {
      setNuevoError("Error de conexion");
    }
  };

  const agregarEmailGrupo = () => {
    const email = grupoEmailInput.trim();
    if (!email) return;
    if (grupoEmails.includes(email)) {
      setGrupoEmailInput("");
      return;
    }
    setGrupoEmails([...grupoEmails, email]);
    setGrupoEmailInput("");
  };

  const quitarEmailGrupo = (email) => {
    setGrupoEmails(grupoEmails.filter((e) => e !== email));
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const cambiarFotoGrupo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setGrupoFoto(b64);
    setGrupoFotoVista(b64);
  };

  const crearGrupo = async (close) => {
    setGrupoError("");
    if (!grupoNombre.trim()) {
      setGrupoError("Ingresa un nombre para el grupo");
      return;
    }
    if (grupoEmails.length === 0) {
      setGrupoError("Agrega al menos dos participantes mas");
      return;
    }
    try {
      const resp = await fetch(BACKEND + "/chats/grupo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioId: usuario.id,
          emails: grupoEmails,
          nombreGrupo: grupoNombre.trim(),
          fotoGrupo: grupoFoto
        })
      });
      const data = await resp.json();
      if (!resp.ok) {
        setGrupoError(data.error || "Error al crear el grupo");
        return;
      }
      setGrupoNombre("");
      setGrupoEmails([]);
      setGrupoFoto(null);
      setGrupoFotoVista(null);
      close();
      await cargarChats();
    } catch (err) {
      setGrupoError("Error de conexion");
    }
  };

  if (!usuario) return null;

  const inicialAvatar = usuario.username ? usuario.username.charAt(0).toUpperCase() : "U";
  const activoAvatar = chatActivo && chatActivo.nombre ? chatActivo.nombre.charAt(0).toUpperCase() : "C";

  return (
    <div className="app-container">
      <div className="chatlist-panel">
        <div className="chatlist-header">
          <div className="user-info">
            <div className="avatar">
              {usuario.foto ? <img src={usuario.foto} alt={usuario.username} /> : inicialAvatar}
            </div>
            <h3>{usuario.username}</h3>
          </div>
          <div className="header-buttons">
            <Popup
              open={popupNuevoChat}
              onClose={() => { setPopupNuevoChat(false); setNuevoError(""); setNuevoEmail(""); }}
              trigger={
                <button className="text-btn" title="Nuevo chat">Nuevo chat</button>
              }
              modal
              nested
            >
              {(close) => (
                <div className="modal">
                  <button className="popup-close" onClick={() => { close(); setNuevoError(""); setNuevoEmail(""); }}>x</button>
                  <h3 className="popup-title">Nuevo chat</h3>
                  {nuevoError && <div className="error-msg">{nuevoError}</div>}
                  <div className="form-group">
                    <label>Email del contacto</label>
                    <Input
                      type="email"
                      value={nuevoEmail}
                      onChange={(e) => setNuevoEmail(e.target.value)}
                      placeholder="contacto@email.com"
                    />
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <Button className="btn-secondary" onClick={() => { close(); setNuevoEmail(""); setNuevoError(""); }}>
                      Cancelar
                    </Button>
                    <Button onClick={() => crearNuevoChat(close)}>Crear chat</Button>
                  </div>
                </div>
              )}
            </Popup>

            <Popup
              open={popupNuevoGrupo}
              onClose={() => {
                setPopupNuevoGrupo(false);
                setGrupoError("");
                setGrupoNombre("");
                setGrupoEmails([]);
                setGrupoEmailInput("");
                setGrupoFoto(null);
                setGrupoFotoVista(null);
              }}
              trigger={
                <button className="text-btn" title="Nuevo grupo">Nuevo grupo</button>
              }
              modal
              nested
            >
              {(close) => (
                <div className="modal">
                  <button
                    className="popup-close"
                    onClick={() => {
                      close();
                      setGrupoError("");
                      setGrupoNombre("");
                      setGrupoEmails([]);
                      setGrupoEmailInput("");
                      setGrupoFoto(null);
                      setGrupoFotoVista(null);
                    }}
                  >x</button>
                  <h3 className="popup-title">Nuevo grupo</h3>
                  {grupoError && <div className="error-msg">{grupoError}</div>}
                  <div className="form-group">
                    <label>Foto del grupo (opcional)</label>
                    <div className="photo-preview">
                      {grupoFotoVista ? <img src={grupoFotoVista} alt="preview" /> : <span>Gr</span>}
                    </div>
                    <label className="photo-label">
                      Elegir imagen
                      <input type="file" accept="image/*" onChange={cambiarFotoGrupo} />
                    </label>
                  </div>
                  <div className="form-group">
                    <label>Nombre del grupo</label>
                    <Input
                      type="text"
                      value={grupoNombre}
                      onChange={(e) => setGrupoNombre(e.target.value)}
                      placeholder="Ej: Trabajo Practico DAI"
                    />
                  </div>
                  <div className="form-group">
                    <label>Emails de los participantes (al menos 2)</label>
                    <div className="tag-list">
                      {grupoEmails.map((email) => (
                        <span key={email} className="tag">
                          {email}
                          <button onClick={() => quitarEmailGrupo(email)}>x</button>
                        </span>
                      ))}
                    </div>
                    <div className="add-tag-row">
                      <Input
                        type="email"
                        value={grupoEmailInput}
                        onChange={(e) => setGrupoEmailInput(e.target.value)}
                        placeholder="email@ejemplo.com"
                      />
                      <button onClick={agregarEmailGrupo}>Agregar</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <Button
                      className="btn-secondary"
                      onClick={() => {
                        close();
                        setGrupoNombre("");
                        setGrupoEmails([]);
                        setGrupoEmailInput("");
                        setGrupoFoto(null);
                        setGrupoFotoVista(null);
                        setGrupoError("");
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={() => crearGrupo(close)}>Crear grupo</Button>
                  </div>
                </div>
              )}
            </Popup>

            <button className="text-btn text-btn-danger" title="Cerrar sesion" onClick={cerrarSesion}>Cerrar sesion</button>
          </div>
        </div>

        <div className="chatlist-search">
          <input type="text" placeholder="Buscar chat..." />
        </div>

        <div className="chatlist-body">
          <ChatList chats={chats} onSelectChat={seleccionarChat} chatActivo={chatActivo} />
        </div>
      </div>

      {chatActivo ? (
        <div className="chat-panel">
          <div className="chat-header">
            <div className="avatar">
              {chatActivo.foto ? <img src={chatActivo.foto} alt={chatActivo.nombre} /> : activoAvatar}
            </div>
            <div className="chat-header-info">
              <h3>{chatActivo.nombre}</h3>
              <p>
                {chatActivo.es_grupo
                  ? (chatActivo.participantes || []).length + 1 + " participantes · " + (conectado ? "Conectado" : "Desconectado")
                  : conectado ? "En linea" : "Desconectado"}
              </p>
            </div>
          </div>

          <div className="chat-messages" ref={mensajesRef}>
            {mensajes.map((m) => (
              <Message
                key={m.id}
                mensaje={m}
                esPropio={m.usuario_id === usuario.id}
                esGrupo={chatActivo.es_grupo}
              />
            ))}
          </div>

          <form className="chat-input-area" onSubmit={enviarMensaje}>
            <input
              type="text"
              placeholder="Escribe un mensaje..."
              value={textoMensaje}
              onChange={(e) => setTextoMensaje(e.target.value)}
            />
            <button type="submit" className="send-btn" disabled={!conectado}>
              Enviar
            </button>
          </form>
        </div>
      ) : (
        <div className="chat-panel-empty">
          <h2>Pio Chat</h2>
          <p>
            Selecciona un chat de la lista para empezar a conversar,
            o crea uno nuevo con los botones Nuevo chat o Nuevo grupo.
          </p>
        </div>
      )}
    </div>
  );
}
