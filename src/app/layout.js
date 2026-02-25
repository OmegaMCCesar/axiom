import "./globals.css";

export const metadata = {
  title: "Axiom Engine | Enterprise Search",
  description: "Motor de búsqueda inteligente y resolución de Q&A",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      {/* antialiased ayuda a que las fuentes se vean más nítidas en cualquier pantalla */}
      <body className="antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}