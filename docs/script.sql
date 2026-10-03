-- TABLA: Usuarios_1
-- ============================================
CREATE TABLE IF NOT EXISTS Usuarios_1 (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(500) NOT NULL,
    mail VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    foto VARCHAR(255) DEFAULT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: Chats (conversaciones individuales y grupales)
-- ============================================
CREATE TABLE IF NOT EXISTS Chats (
    id_chat INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) DEFAULT NULL,
    foto VARCHAR(255) DEFAULT NULL,
    es_grupal TINYINT(1) NOT NULL DEFAULT 0,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: Chat_por_Usuarios (relacion muchos a muchos)
-- ============================================
CREATE TABLE IF NOT EXISTS Chat_por_Usuarios (
    id_chat_usuario INT PRIMARY KEY AUTO_INCREMENT,
    id_chat INT NOT NULL,
    id_usuario INT NOT NULL,
    fecha_union DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_chat) REFERENCES Chats(id_chat) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios_1(id_usuario) ON DELETE CASCADE,
    UNIQUE KEY unique_chat_usuario (id_chat, id_usuario)
);

-- ============================================
-- TABLA: Mensajes (historial de cada chat)
-- ============================================
CREATE TABLE IF NOT EXISTS Mensajes (
    id_mensaje INT PRIMARY KEY AUTO_INCREMENT,
    id_chat INT NOT NULL,
    id_usuario INT NOT NULL,
    contenido TEXT NOT NULL,
    fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_chat) REFERENCES Chats(id_chat) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios_1(id_usuario) ON DELETE CASCADE
);