// src/app/components/ChatBot/ChatBot.jsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FaStore, FaPaperPlane, FaTimes, FaShoppingCart, FaEye, FaCheckCircle } from 'react-icons/fa';
import styles from './ChatBot.module.css';
import { slugify } from '@/utils/helpers';
import { useAlert } from '@/components/ui/AlertContext'; // Asegúrate de que la ruta coincida con la ubicación de tu contexto
import { useCart } from '@/context/CartContext'; // Asegúrate de que la ruta coincida con la ubicación de tu contexto

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { addToCart } = useCart();
  const { showAlert } = useAlert();

  const pathname = usePathname();
  const router = useRouter();

  const getUserRoleContext = () => {
    if (pathname?.includes('/admin')) return "ADMINISTRADOR";
    if (pathname?.includes('/vendedor')) return "VENDEDOR";
    return "CLIENTE";
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
      const currentRole = getUserRoleContext();
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: messages.concat(userMessage),
          userRole: currentRole
        }),
      });

      const data = await response.json();
      if (data.error) {
        setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${data.error}` }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error de conexión' }]);
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

  // --- LÓGICA CARRITO (Alineada a la derecha y sin emojis) ---
  const handleAddToCartReal = (productData) => {
    addToCart({
      id: productData.id,
      name: productData.name,
      price: productData.price,
      images: [productData.image],
      stock: productData.stock || 10
    });
    showAlert(`Agregado al carrito: ${productData.name}`, 'success');
  };

  // Función para procesar el texto del bot y separar tarjetas de productos
  const renderMessageContent = (content) => {
    const productRegex = /\[PRODUCTO:(.*?)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = productRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={lastIndex}>{content.substring(lastIndex, match.index)}</span>);
      }

      try {
        const productData = JSON.parse(match[1]);
        parts.push(
          <div key={match.index} className="my-2 p-2.5 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <img
              src={productData.image && productData.image !== 'sin-imagen' ? productData.image : '/placeholder.png'}
              alt={productData.name}
              className="w-14 h-14 object-cover rounded-lg border border-gray-100 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-xs text-[#010f20] truncate">{productData.name}</p>
              <p className="text-[11px] font-bold text-emerald-600">${productData.price}</p>

              <div className="flex items-center gap-2 mt-1.5">
                <button
                  onClick={() => {
                    router.push(`/producto/${slugify(productData.name)}`);
                  }}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-[#010f20] rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <FaEye size={10} /> Ver
                </button>
                <button
                  onClick={() => {
                    handleAddToCartReal(productData);
                  }}
                  className="px-2 py-1 bg-[#010f20] hover:bg-[#010f20]/90 text-white rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <FaShoppingCart size={10} /> Comprar
                </button>
              </div>
            </div>
          </div>
        );
      } catch (e) {
        console.error("Error parseando producto del bot", e);
      }

      lastIndex = productRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push(<span key={lastIndex}>{content.substring(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : content;
  };

  const quickOptions = [
    { label: 'Ver productos destacados', value: 'Muéstrame los productos más populares de la tienda' },
    { label: 'Consultar envíos y devoluciones', value: '¿Cómo funcionan los envíos y las devoluciones?' },
  ];

  // El checkout debe permanecer despejado y el carrito queda congelado durante el pago.
  if (pathname === '/checkout') return null;

  return (
    <>
      <div className={styles.chatbotContainer}>
        <button className={styles.chatButton} onClick={toggleChat}>
          {isOpen ? <FaTimes size={24} /> : <FaStore size={24} />}
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
                    ¡Hola! Me alegra que estés aquí.<br />
                    Hoy podemos explorar cosas nuevas y divertirnos. ¿Qué te gustaría hacer?
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
                      className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.botMessage
                        }`}
                    >
                      {renderMessageContent(msg.content)}
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
    </>
  );
};

export default ChatBot;
