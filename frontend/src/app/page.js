"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const guardado = localStorage.getItem("piochat_usuario");
    if (guardado) {
      router.replace("/chat");
    } else {
      setListo(true);
    }
  }, [router]);

  if (!listo) return null;

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Pio Chat</h1>
        <h2>Bienvenido al chat en tiempo real</h2>
        <div style={{ display: "flex", gap: "15px", justifyContent: "center", marginTop: "20px", flexWrap: "wrap" }}>
          <Link href="/login" style={{
            padding: "12px 24px",
            background: "#4f46e5",
            color: "#fff",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "600"
          }}>
            Iniciar sesion
          </Link>
          <Link href="/register" style={{
            padding: "12px 24px",
            background: "#fff",
            color: "#4f46e5",
            border: "2px solid #4f46e5",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "600"
          }}>
            Registrarse
          </Link>
        </div>
      </div>
    </div>
  );
}

