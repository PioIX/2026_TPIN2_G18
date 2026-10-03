import "./globals.css";

export const metadata = {
  title: "Pio Chat",
  description: "Chat en tiempo real - TP Integrador"
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

