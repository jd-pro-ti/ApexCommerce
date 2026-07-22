// src/app/page.js
import ChatBot from '../components/chatbot/ChatBot';

export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>🛒 Bienvenido a mi Ecommerce</h1>
      <p>Este es un proyecto escolar. Prueba el asistente haciendo clic en el botón de abajo a la derecha.</p>
      <p>Pregunta sobre productos, precios, envíos, etc.</p>
      
      {/* El asistente se renderiza aquí, pero flota fijo */}
      <ChatBot />
    </main>
  );
}