// src/app/components/ChatBot/ChatBot.jsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { FaStore, FaPaperPlane, FaTimes } from 'react-icons/fa'; // Cambio de FaRobot a FaStore
import styles from './ChatBot.module.css';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const SYSTEM_PROMPT = {
    role: 'user',
    content: `Eres un asistente amigable y divertido.

Reglas importantes:
- Siempre responde en español.
- Usa un tono cálido, alegre y cercano.
- Incluye emojis para hacer la conversación más entretenida 😊.
- NO uses formato Markdown (nada de **negritas**, *cursivas* o listas con guiones).
- Usa frases y respuestas cortas.
- Responde siempre de forma positiva y alentadora.
- Eres el asistente de una tienda online (Apex commerce). Ayudas a los clientes con dudas sobre productos, envíos, precios y promociones.

Ejemplo de cómo debes responder:
"¡Hola! 👋 Me alegra que estés aquí. Hoy podemos aprender cosas nuevas y divertirnos. ¿Qué te gustaría saber? 🚀"`
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSend = async (text) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage = { role: 'user', content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    if (!text) setInput('');
    setLoading(true);

    try {
      const historyToSend = [SYSTEM_PROMPT, ...messages, userMessage];

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: historyToSend }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setMessages((prev) => [...prev, { role: 'assistant', content: `❌ Error ${response.status}: ${errorText}` }]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.error) {
        setMessages((prev) => [...prev, { role: 'assistant', content: `❌ ${data.error}` }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: '❌ Error de conexión' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickOptions = [
    { label: 'Ver productos destacados 📱', value: 'Muéstrame los productos más populares de la tienda' },
    { label: 'Consultar envíos y devoluciones 📦', value: '¿Cómo funcionan los envíos y las devoluciones?' },
    { label: 'Ofertas y descuentos 💰', value: '¿Hay alguna oferta o descuento disponible hoy?' },
    { label: 'Ayuda con mi compra 🛒', value: 'Necesito ayuda para elegir un producto' },
  ];

  return (
    <div className={styles.chatbotContainer}>
      <button className={styles.chatButton} onClick={toggleChat}>
        {isOpen ? <FaTimes size={24} /> : <FaStore size={24} />} {/* Cambio a FaStore */}
      </button>

      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <FaStore size={24} />
            <span>Apex-ito</span>
            <button onClick={toggleChat} className={styles.closeButton}>
              <FaTimes />
            </button>
          </div>

          <div className={styles.messagesContainer}>
            {messages.length === 0 ? (
              <div className={styles.welcomeWrapper}>
                <div className={styles.welcomeMessage}>
                  ¡Hola! 🛍️ Me alegra que estés aquí.<br />
                  Hoy podemos aprender cosas nuevas y divertirnos. ¿Qué te gustaría hacer?
                </div>
                <div className={styles.quickOptions}>
                  {quickOptions.map((opt) => (
                    <button
                      key={opt.label}
                      className={styles.quickOption}
                      onClick={() => handleSend(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`${styles.message} ${
                      msg.role === 'user' ? styles.userMessage : styles.botMessage
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
                {loading && (
                  <div className={`${styles.message} ${styles.botMessage}`}>
                    <span className={styles.typing}>Escribiendo</span>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.inputContainer}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje aquí"
              rows={1}
              className={styles.inputField}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className={styles.sendButton}
            >
              <FaPaperPlane />
            </button>
          </div>

          <div className={styles.chatFooter}>
            Desarrollado por <span>Optima Cart</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;