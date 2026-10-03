"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function useSocket() {
  const socketRef = useRef(null);
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io("http://localhost:4000", {
        transports: ["websocket", "polling"]
      });

      socketRef.current.on("connect", () => {
        setConectado(true);
      });

      socketRef.current.on("disconnect", () => {
        setConectado(false);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return { socket: socketRef.current, conectado };
}

