"use client";

import ChatItem from "./ChatItem";

export default function ChatList({ chats, onSelectChat, chatActivo }) {
  if (!chats || chats.length === 0) {
    return (
      <div className="empty-list">
        <p>No tenes chats todavia.</p>
        <p style={{ marginTop: "10px", fontSize: "13px" }}>
          Usa los botones Nuevo chat o Nuevo grupo para empezar una conversacion.
        </p>
      </div>
    );
  }

  return (
    <div>
      {chats.map((chat) => (
        <ChatItem
          key={chat.id}
          chat={chat}
          onClick={() => onSelectChat(chat)}
          active={chatActivo && chatActivo.id === chat.id}
        />
      ))}
    </div>
  );
}

