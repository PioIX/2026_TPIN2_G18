# TP-Integrador---Pio-Chat-Chat-en-tiempo-real
Proyecto sobre un chat en tiempo real
# 2026_TPIN2_G18 - Pio Chat

Trabajo Práctico Integrador - Segundo Cuatrimestre
Materias: Desarrollo de Aplicaciones Informáticas y Proyectos de Producción
Curso: 5to año - Informática
Grupo: N° 18

## Descripción

Aplicación de chat en tiempo real similar a WhatsApp, desarrollada con:
- **Frontend**: Next.js + React (App Router) en el puerto 3000
- **Backend**: Node.js + Express + Socket.IO en el puerto 4000
- **Base de datos**: MySQL (schema `2026_5INF_G18`)

Permite a los usuarios iniciar sesión, registrarse, ver su lista de chats (conversaciones individuales y grupales), crear chats nuevos, ver el historial de mensajes y comunicarse en tiempo real mediante WebSockets (Socket.IO).

## Credenciales de acceso (usuarios reales de la base de datos)

| Usuario | Email | Contraseña |
| --- | --- | --- |
| Juan Perez | juan@gmail.com | 12345678 |
| Ivan Gonzalez | ivan@gmail.com | 87654321 |
| Faustino | faustinovicentebrea@gmail.com | 12345678 |

> Usuario de ejemplo para docentes:
> - Email: `juan@gmail.com`
> - Contraseña: `12345678`

## Estructura del proyecto

```
2026_TPIN2_G18/
├── frontend/            # Proyecto Next.js (puerto 3000 / 3001)
│   ├── public/
│   │   ├── grupos/      # Fotos de grupos (default.svg)
│   │   └── usuarios/    # Fotos de perfiles (default.svg)
│   └── src/
│       ├── app/         # Rutas: /, /login, /register, /chat
│       ├── components/  # Button, Input, ChatItem, ChatList, Message
│       └── hooks/       # useSocket.js
├── backend/             # Servidor Node.js + Express + Socket.IO (puerto 4000)
│   ├── modulos/
│   │   └── mysql.js     # Pool de conexión MySQL
│   ├── index.js         # Endpoints REST + eventos Socket.IO
│   ├── .pio.env         # Configuración para red interna / facultad
│   ├── .home.env        # Configuración para acceso remoto / casa
│   └── package.json
├── docs/
│   ├── DER              # Diagrama Entidad Relación (drawio / png / pdf)
│   └── script.sql       # Estructura de tablas (documentacion / referencia)
└── README.md
```

## Pasos para levantar la aplicación

> ⚠️ TODOS los datos (usuarios, chats, mensajes) se cargan DINÁMICAMENTE desde la
> base de datos MySQL **en tiempo real**. No hay datos precargados en el código,
> y el archivo `docs/script.sql` es solamente la documentación de la estructura
> (el backend no lo ejecuta al levantar ni importa los inserts de ejemplo).

### 1) Base de datos MySQL
1. Asegurarse de que el schema `2026_5INF_G18` cuenta con las tablas `Usuarios_1`, `Chats`, `Chat_por_Usuarios` y `Mensajes` (estructura descrita en `docs/script.sql`).
2. Los usuarios, chats y mensajes existentes son los que están almacenados directamente en estas tablas; la app los levanta con `SELECT` desde el backend.

### 2) Backend (puerto 4000)
El proyecto cuenta con dos configuraciones de entorno:
- **Red interna / Facultad**: usa el archivo `.pio.env` (IP `10.1.5.205`)
- **Acceso remoto / Casa**: usa el archivo `.home.env` (IP pública `186.19.136.253`)

```bash
cd backend
npm install

# Entorno facultad / red interna:
npm run pio

# O entorno casa / acceso remoto:
npm run home
```

### 3) Frontend (puerto 3000)
```bash
cd frontend
npm install
npm run dev
```

Para probar el chat en tiempo real en dos clientes, pueden abrir una segunda instancia:
```bash
npm run dev -- -p 3001
```

## Funcionalidades implementadas

### Base de datos (schema `2026_5INF_G18`)
- Tabla `Usuarios_1`: datos de los usuarios registrados (`id_usuario`, `username`, `mail`, `password`, `foto`, `fecha_registro`).
- Tabla `Chats`: conversaciones individuales y grupales (`id_chat`, `nombre`, `foto`, `es_grupal`, `fecha_creacion`).
- Tabla `Chat_por_Usuarios`: relación muchos a muchos entre usuarios y chats (`id_chat_usuario`, `id_chat`, `id_usuario`, `fecha_union`).
- Tabla `Mensajes`: historial de mensajes de cada chat (`id_mensaje`, `id_chat`, `id_usuario`, `contenido`, `fecha_envio`).

### Backend (Express + Socket.IO)
- `POST /login` - inicio de sesión con email y contraseña
- `POST /register` - registro de nuevos usuarios (opcional con foto)
- `GET /chats/:usuarioId` - listado de chats del usuario logueado, incluyendo foto del contacto / grupo y último mensaje
- `POST /chats/nuevo` - crear chat individual a partir del email de otro usuario
- `POST /chats/grupo` - crear chat grupal con múltiples emails, nombre y foto (opcional)
- `GET /chats/:chatId/mensajes` - historial de mensajes de un chat (ordenado por fecha)
- `GET /usuarios/buscar/:email` - búsqueda de usuarios por email
- **Socket.IO**: eventos `join_chat`, `leave_chat`, `enviar_mensaje` (guarda en BD + emite `nuevo_mensaje` a todos los participantes conectados al chat)

### Frontend (Next.js App Router)
- Páginas de Inicio (`/`), Login (`/login`) y Registro (`/register`)
- Página de Chat (`/chat`) con lista de contactos, panel de conversación y popups
- Componentes reutilizables: `Button`, `Input`, `ChatItem`, `ChatList`, `Message`
- Lista de chats con foto del contacto/grupo o avatar por defecto (`default.svg`)
- Popup con `reactjs-popup` para crear chat nuevo (por email de contacto)
- Popup para crear grupo nuevo (múltiples emails, nombre, foto opcional)
- Chat en tiempo real mediante WebSockets con el hook `useSocket`
- Diferenciación visual entre mensajes enviados y recibidos (y nombre de remitente en grupos)
