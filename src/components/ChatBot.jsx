// components/Chatbot.jsx
import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User } from 'lucide-react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const initialMessage = {
    id: 1,
    text: "¡Hola! 👋 Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?",
    sender: 'bot',
    timestamp: new Date()
  };

  const [messages, setMessages] = useState([initialMessage]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Función para reiniciar la conversación
  const resetConversation = () => {
    setMessages([initialMessage]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simular respuesta del bot (aquí integrarías Dialogflow)
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: getBotResponse(inputMessage),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const getBotResponse = (message) => {
    const lowerMessage = message.toLowerCase();

    // Detectar frases de despedida o finalización
    if (lowerMessage.includes('gracias') ||
      lowerMessage.includes('ok') ||
      lowerMessage.includes('okay') ||
      lowerMessage.includes('listo') ||
      lowerMessage.includes('adiós') ||
      lowerMessage.includes('adios') ||
      lowerMessage.includes('chao') ||
      lowerMessage.includes('bye') ||
      lowerMessage.includes('hasta luego') ||
      lowerMessage.includes('nos vemos') ||
      lowerMessage.includes('perfecto') ||
      lowerMessage.includes('está bien') ||
      lowerMessage.includes('esta bien') ||
      lowerMessage.includes('entendido') ||
      lowerMessage.includes('de acuerdo')) {

      // Reiniciar la conversación después de un breve delay
      setTimeout(() => {
        resetConversation();
      }, 5000);

      return "¡De nada! 😊 Si necesitas ayuda con algo más, no dudes en preguntar. ¡Que tengas un excelente día! 👋";
    }

    if (lowerMessage.includes('precio') || lowerMessage.includes('cuánto') || lowerMessage.includes('costo')) {
      return "Los precios varían según el producto. Te recomiendo revisar nuestra sección de productos donde encontrarás todos los precios actualizados. 💰";
    }

    if (lowerMessage.includes('envío') || lowerMessage.includes('entrega') || lowerMessage.includes('envio')) {
      return "Realizamos envíos a toda la ciudad. La entrega solo se realiza hasta las 5:00 PM. Los pedidos que se realizan después de las 5:00 PM se entregarán el siguiente día. 🚚";
    }

    if (lowerMessage.includes('horario') || lowerMessage.includes('atención') || lowerMessage.includes('abierto') || lowerMessage.includes('atencion')) {
      return "Estamos disponibles para entrega o recogida de lunes a domingo de 9:00 AM a 5:00 PM ⏰. Los pedidos se pueden realizar en cualquier momento de la jornada. ¿Necesitas ayuda con algo más? 👍";
    }

    if (lowerMessage.includes('producto') || lowerMessage.includes('catálogo') || lowerMessage.includes('catalogo')) {
      return "Tenemos una amplia variedad de productos. Puedes explorarlos todos en nuestra sección 'Productos'. ¿Buscas algo específico? 🛍️";
    }

    if (lowerMessage.includes('contacto') || lowerMessage.includes('teléfono') || lowerMessage.includes('telefono')) {
      return "Puedes contactarnos por WhatsApp para cualquier consulta o ayuda haciendo clic en el botón flotante en la esquina inferior derecha. 📞";
    }

    if (lowerMessage.includes('usd') || lowerMessage.includes('dólares') || lowerMessage.includes('dolar') || lowerMessage.includes('cup') || lowerMessage.includes('euro') || lowerMessage.includes('peso') || lowerMessage.includes('moneda') || lowerMessage.includes('transferencia')) {
      return "Aceptamos solo pagos en dólares, pesos cubanos (al cambio + 10 pesos x USD) o euros (según la tasa de cambio respecto al USD). Por favor, contáctanos para más información sobre tasa de cambio. 💰";
    }

    if (lowerMessage.includes('pago') || lowerMessage.includes('pagar') || lowerMessage.includes('tarjeta') || lowerMessage.includes('efectivo')) {
      return "El pago se realiza presencial en la tienda o al ser entregado el producto por el mensajero";
    }

    if (lowerMessage.includes('mensajer')) {
      return "El precio de la mensajería es relativo al lugar de entrega, al hacer tu pedido coloca tu dirección en el formulario de envío y cuando recibamos la orden te notificamos el valor de la entrega";
    }

    if (lowerMessage.includes('provincia') || lowerMessage.includes('ciudad') || lowerMessage.includes('direccion') || lowerMessage.includes('funcionamos')) {
      return "Nuestro negocio se encuentra ubicado en La Habana, 10 de Octubre. Más detalles al privado.🏬";
    }

    if (lowerMessage.includes('pedido') || lowerMessage.includes('realizar') || lowerMessage.includes('hacer')) {
      return "Para realizar un pedido, por favor visita nuestra página de productos y agrega los artículos que deseas comprar al carrito. Una vez hayas terminado y tus datos estén en el formulario de envio, haz clic en 'Enviar pedido por WhatsApp' para proceder con la compra. 🛒";
    }

    return "La información que necesitas no te la puedo proporcionar. Puedes contactar con nuestro equipo de ventas usando el botón de WhatsApp flotante abajo a la derecha. ¿Hay algo más en lo que pueda asistirte? 😊";
  };

  const suggestedQuestions = [
    "¿Cuáles son sus horarios?",
    "¿Hacen envíos?",
    "¿Qué métodos de pago aceptan?",
    "¿Qué monedas aceptan?",
    "¿Cómo realizo un pago?",
    "¿Precio de la mensajería?",
    "¿Cómo puedo hacer un pedido?",
    "¿Dónde funcionamos?",
  ];

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-32 right-6 z-0 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
          aria-label="Abrir chat"
        >
          <Bot className="w-8 h-8 text-white" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-40 w-96 h-[600px] bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl flex flex-col border border-neutral-200 dark:border-neutral-700">
          {/* Header */}
          <div className="bg-green-500 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold">Centro de ayuda Merca Hogar</h3>
                <p className="text-green-100 text-sm">En línea</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-green-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-neutral-50 dark:bg-neutral-900">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex mb-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 ${message.sender === 'user'
                    ? 'bg-green-500 text-white rounded-br-none'
                    : 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-600 rounded-bl-none'
                    }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {message.sender === 'bot' ? (
                      <Bot className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-white dark:bg-neutral-700 rounded-2xl rounded-bl-none p-3 border border-neutral-200 dark:border-neutral-600">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Suggested Questions */}
            {messages.length <= 2 && (
              <div className="mt-4">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                  Preguntas frecuentes:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setInputMessage(question);
                        setTimeout(() => {
                          document.getElementById('chat-form')?.dispatchEvent(
                            new Event('submit', { bubbles: true })
                          );
                        }, 100);
                      }}
                      className="text-xs bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-full px-3 py-1 hover:bg-neutral-50 dark:hover:bg-neutral-600 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form id="chat-form" onSubmit={handleSendMessage} className="p-4 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="flex-1 px-4 py-2 border border-neutral-200 dark:border-neutral-600 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;