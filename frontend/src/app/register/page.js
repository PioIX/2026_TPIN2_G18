"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import Input from "@/components/Input";

const BACKEND = "http://localhost:4000";

export default function LoginPage() {
  const router = useRouter();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [redirigiendo, setRedirigiendo] = useState(false);

  useEffect(() => {
    const guardado = localStorage.getItem("piochat_usuario");
    if (guardado) {
      router.replace("/chat");
    }
  }, [router]);

  const hacerLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!loginEmail || !loginPassword) {
      setErrorMsg("Completa todos los campos");
      return;
    }
    try {
      const resp = await fetch(BACKEND + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await resp.json();
      if (!resp.ok) {
        setErrorMsg(data.error || "Error al iniciar sesion");
        return;
      }
      localStorage.setItem("piochat_usuario", JSON.stringify(data.usuario));
      setRedirigiendo(true);
      setTimeout(() => router.push("/chat"), 100);
    } catch (err) {
      setErrorMsg("Error de conexion. Asegurate de que el backend este corriendo.");
    }
  };

  if (redirigiendo) return null;

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Pio Chat</h1>
        <h2>Inicia sesion para continuar</h2>

        {errorMsg && <div className="error-msg">{errorMsg}</div>}

        <form onSubmit={hacerLogin}>
          <div className="form-group">
            <label>Email</label>
            <Input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </div>
          <div className="form-group">
            <label>Contrasena</label>
            <Input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Contrasena"
            />
          </div>
          <Button type="submit">Iniciar sesion</Button>
          <Link href="/register" className="toggle-link">
            No tenes cuenta? Registrate
          </Link>
        </form>
      </div>
    </div>
  );
}

