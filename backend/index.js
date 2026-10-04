const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const pool = require("./modulos/mysql");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const FOTO_DEFAULT_USUARIO = "/usuarios/default.svg";
const FOTO_DEFAULT_GRUPO = "/grupos/default.svg";

(async () => {
  try {
    await pool.query("SELECT 1");

    await pool.query(`CREATE TABLE IF NOT EXISTS Usuarios_1 (
      id_usuario INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(500) NOT NULL,
      mail VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      foto VARCHAR(255) DEFAULT NULL,
      fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS Chats (
      id_chat INT PRIMARY KEY AUTO_INCREMENT,
      nombre VARCHAR(100) DEFAULT NULL,
      foto VARCHAR(255) DEFAULT NULL,
      es_grupal TINYINT(1) NOT NULL DEFAULT 0,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS Chat_por_Usuarios (
      id_chat_usuario INT PRIMARY KEY AUTO_INCREMENT,
      id_chat INT NOT NULL,
      id_usuario INT NOT NULL,
      fecha_union DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_chat) REFERENCES Chats(id_chat) ON DELETE CASCADE,
      FOREIGN KEY (id_usuario) REFERENCES Usuarios_1(id_usuario) ON DELETE CASCADE,
      UNIQUE KEY unique_chat_usuario (id_chat, id_usuario)
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS Mensajes (
      id_mensaje INT PRIMARY KEY AUTO_INCREMENT,
      id_chat INT NOT NULL,
      id_usuario INT NOT NULL,
      contenido TEXT NOT NULL,
      fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_chat) REFERENCES Chats(id_chat) ON DELETE CASCADE,
      FOREIGN KEY (id_usuario) REFERENCES Usuarios_1(id_usuario) ON DELETE CASCADE
    )`);

    console.log("Base de datos inicializada OK");
  } catch (err) {
    console.error("Error al inicializar la base de datos:", err && err.message ? err.message : err);
  }
})();

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }
    const [rows] = await pool.query(
      "SELECT id_usuario as id, username, mail as email, password, foto, fecha_registro as fecha_creacion FROM Usuarios_1 WHERE mail = ? AND password = ?",
      [email, password]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }
    const usuario = rows[0];
    delete usuario.password;
    res.json({ ok: true, usuario });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { username, email, password, foto } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }
    const [existe] = await pool.query("SELECT id_usuario as id FROM Usuarios_1 WHERE mail = ?", [email]);
    if (existe.length > 0) {
      return res.status(400).json({ error: "El email ya esta registrado" });
    }
    const fotoGuardar = foto || null;
    const [result] = await pool.query(
      "INSERT INTO Usuarios_1 (username, mail, password, foto) VALUES (?, ?, ?, ?)",
      [username, email, password, fotoGuardar]
    );
    const [nuevoUsuario] = await pool.query(
      "SELECT id_usuario as id, username, mail as email, foto, fecha_registro as fecha_creacion FROM Usuarios_1 WHERE id_usuario = ?",
      [result.insertId]
    );
    res.json({ ok: true, usuario: nuevoUsuario[0] });
  } catch (error) {
    console.error("Error en register:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

app.get("/chats/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const [chatsUsuario] = await pool.query(
      "SELECT id_chat as chat_id FROM Chat_por_Usuarios WHERE id_usuario = ?",
      [usuarioId]
    );
    if (chatsUsuario.length === 0) {
      return res.json([]);
    }
    const chatIds = chatsUsuario.map(cu => cu.chat_id);
    const placeholders = chatIds.map(() => "?").join(",");

    const [chats] = await pool.query(
      `SELECT c.id_chat as id, c.nombre, c.es_grupal as es_grupo, c.foto, c.fecha_creacion
       FROM Chats c WHERE c.id_chat IN (${placeholders}) ORDER BY
        (SELECT MAX(m.fecha_envio) FROM Mensajes m WHERE m.id_chat = c.id_chat) DESC,
        c.fecha_creacion DESC`,
      chatIds
    );

    const resultado = [];
    for (const chat of chats) {
      const [otrosUsuarios] = await pool.query(
        `SELECT u.id_usuario as id, u.username, u.mail as email, u.foto
         FROM Chat_por_Usuarios cu
         JOIN Usuarios_1 u ON cu.id_usuario = u.id_usuario
         WHERE cu.id_chat = ? AND u.id_usuario != ?`,
        [chat.id, usuarioId]
      );

      let nombreMostrar = chat.nombre;
      let fotoMostrar = chat.foto;

      if (!chat.es_grupo && otrosUsuarios.length > 0) {
        const otro = otrosUsuarios[0];
        nombreMostrar = otro.username;
        fotoMostrar = otro.foto;
      }

      const [ultimoMsg] = await pool.query(
        `SELECT m.id_mensaje as id, m.id_chat as chat_id, m.id_usuario as usuario_id,
                m.contenido, m.fecha_envio, u.username as remitente_nombre
         FROM Mensajes m
         JOIN Usuarios_1 u ON m.id_usuario = u.id_usuario
         WHERE m.id_chat = ?
         ORDER BY m.fecha_envio DESC
         LIMIT 1`,
        [chat.id]
      );

      resultado.push({
        id: chat.id,
        nombre: nombreMostrar,
        es_grupo: chat.es_grupo,
        foto: fotoMostrar || (chat.es_grupo ? FOTO_DEFAULT_GRUPO : FOTO_DEFAULT_USUARIO),
        fecha_creacion: chat.fecha_creacion,
        participantes: otrosUsuarios,
        ultimo_mensaje: ultimoMsg.length > 0 ? ultimoMsg[0] : null
      });
    }
    res.json(resultado);
  } catch (error) {
    console.error("Error al obtener chats:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

app.post("/chats/nuevo", async (req, res) => {
  try {
    const { usuarioId, emailOtro } = req.body;
    if (!usuarioId || !emailOtro) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }
    const [otroUsuario] = await pool.query(
      "SELECT id_usuario as id FROM Usuarios_1 WHERE mail = ?",
      [emailOtro]
    );
    if (otroUsuario.length === 0) {
      return res.status(404).json({ error: "No existe un usuario con ese email" });
    }
    const otroId = otroUsuario[0].id;
    if (parseInt(otroId) === parseInt(usuarioId)) {
      return res.status(400).json({ error: "No podes crear un chat con vos mismo" });
    }

    const [chatExistente] = await pool.query(
      `SELECT cu1.id_chat as chat_id
       FROM Chat_por_Usuarios cu1
       JOIN Chat_por_Usuarios cu2 ON cu1.id_chat = cu2.id_chat
       JOIN Chats c ON cu1.id_chat = c.id_chat
       WHERE cu1.id_usuario = ? AND cu2.id_usuario = ? AND c.es_grupal = 0
       LIMIT 1`,
      [usuarioId, otroId]
    );
    if (chatExistente.length > 0) {
      return res.json({ ok: true, chatId: chatExistente[0].chat_id, mensaje: "Chat ya existente" });
    }

    const [nuevoChat] = await pool.query(
      "INSERT INTO Chats (nombre, es_grupal, foto) VALUES (?, ?, ?)",
      [null, 0, null]
    );
    const chatId = nuevoChat.insertId;
    await pool.query(
      "INSERT INTO Chat_por_Usuarios (id_chat, id_usuario) VALUES (?, ?)",
      [chatId, usuarioId]
    );
    await pool.query(
      "INSERT INTO Chat_por_Usuarios (id_chat, id_usuario) VALUES (?, ?)",
      [chatId, otroId]
    );

    res.json({ ok: true, chatId });
  } catch (error) {
    console.error("Error al crear chat:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

app.post("/chats/grupo", async (req, res) => {
  try {
    const { usuarioId, emails, nombreGrupo, fotoGrupo } = req.body;
    if (!usuarioId || !emails || emails.length === 0 || !nombreGrupo) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }
    const usuariosValidos = [];
    for (const email of emails) {
      const [usuario] = await pool.query(
        "SELECT id_usuario as id, username, mail as email FROM Usuarios_1 WHERE mail = ?",
        [email]
      );
      if (usuario.length === 0) {
        return res.status(404).json({ error: "No existe un usuario con email: " + email });
      }
      usuariosValidos.push(usuario[0]);
    }

    const idsParticipantes = new Set();
    idsParticipantes.add(parseInt(usuarioId));
    usuariosValidos.forEach(u => idsParticipantes.add(parseInt(u.id)));

    if (idsParticipantes.size < 3) {
      return res.status(400).json({ error: "Un grupo debe tener al menos 3 participantes" });
    }

    const fotoGuardar = fotoGrupo || null;
    const [nuevoChat] = await pool.query(
      "INSERT INTO Chats (nombre, es_grupal, foto) VALUES (?, ?, ?)",
      [nombreGrupo, 1, fotoGuardar]
    );
    const chatId = nuevoChat.insertId;

    for (const idUser of idsParticipantes) {
      await pool.query(
        "INSERT INTO Chat_por_Usuarios (id_chat, id_usuario) VALUES (?, ?)",
        [chatId, idUser]
      );
    }
    res.json({ ok: true, chatId });
  } catch (error) {
    console.error("Error al crear grupo:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

app.get("/chats/:chatId/mensajes", async (req, res) => {
  try {
    const { chatId } = req.params;
    const [mensajes] = await pool.query(
      `SELECT m.id_mensaje as id, m.id_chat as chat_id, m.id_usuario as usuario_id,
              m.contenido, m.fecha_envio,
              u.username as remitente_nombre, u.foto as remitente_foto
       FROM Mensajes m
       JOIN Usuarios_1 u ON m.id_usuario = u.id_usuario
       WHERE m.id_chat = ?
       ORDER BY m.fecha_envio ASC`,
      [chatId]
    );
    res.json(mensajes);
  } catch (error) {
    console.error("Error al obtener mensajes:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

app.get("/usuarios/buscar/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const [usuarios] = await pool.query(
      "SELECT id_usuario as id, username, mail as email, foto FROM Usuarios_1 WHERE mail LIKE ? LIMIT 10",
      ["%" + email + "%"]
    );
    res.json(usuarios);
  } catch (error) {
    console.error("Error al buscar usuarios:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);

  socket.on("join_chat", (chatId) => {
    socket.join("chat_" + chatId);
    console.log("Socket " + socket.id + " se unio al chat " + chatId);
  });

  socket.on("leave_chat", (chatId) => {
    socket.leave("chat_" + chatId);
    console.log("Socket " + socket.id + " abandono el chat " + chatId);
  });

  socket.on("enviar_mensaje", async (datos) => {
    try {
      const { chat_id, usuario_id, contenido } = datos;
      if (!chat_id || !usuario_id || !contenido) return;

      const [result] = await pool.query(
        "INSERT INTO Mensajes (id_chat, id_usuario, contenido) VALUES (?, ?, ?)",
        [chat_id, usuario_id, contenido]
      );
      const [mensajeNuevo] = await pool.query(
        `SELECT m.id_mensaje as id, m.id_chat as chat_id, m.id_usuario as usuario_id,
                m.contenido, m.fecha_envio,
                u.username as remitente_nombre, u.foto as remitente_foto
         FROM Mensajes m
         JOIN Usuarios_1 u ON m.id_usuario = u.id_usuario
         WHERE m.id_mensaje = ?`,
        [result.insertId]
      );
      if (mensajeNuevo.length > 0) {
        io.to("chat_" + chat_id).emit("nuevo_mensaje", mensajeNuevo[0]);
      }
    } catch (error) {
      console.error("Error al enviar mensaje por socket:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log("Servidor corriendo en http://localhost:" + PORT);
});