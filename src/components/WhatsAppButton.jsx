import React, { useState } from 'react';
import { MessageCircle, X, Send, ArrowLeft } from 'lucide-react';

const WhatsAppComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [message, setMessage] = useState('');

  const contacts = [
    {
      id: 1,
      name: 'Yaniuska Verdecia',
      role: 'Atención al Cliente',
      description: 'Encargada de ventas',
      avatar: '👩‍💼',
      phone: '+5358582428',
      online: true
    },
    {
      id: 2, // Cambiado de 1 a 2
      name: 'Roberto Verdecia',
      role: 'Soporte técnico',
      description: 'Encargado de resolver dudas y problemas técnicos',
      avatar: '👨‍💻',
      phone: '+5358582428',
      online: true
    },
  ];

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSelectedContact(null);
      setMessage('');
    }
  };

  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
  };

  const handleBackToContacts = () => {
    setSelectedContact(null);
    setMessage('');
  };

  const handleSendMessage = () => {
    if (message.trim() && selectedContact) {
      const whatsappURL = `https://wa.me/${selectedContact.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappURL, '_blank');
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Botón flotante con efecto pulsing */}
      {!isOpen && (
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-60"></div>
          <button
            onClick={handleToggle}
            className="relative bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
            aria-label="Abrir chat de WhatsApp"
          >
            <MessageCircle size={24} />
          </button>
        </div>
      )}

      {/* Ventana de chat */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-100 max-w-[96vw] max-h-[80vh] overflow-hidden animate-slide-in-bottom">
          {!selectedContact ? (
            // Vista de lista de contactos
            <>
              {/* Header */}
              <div className="bg-green-500 text-white p-4 flex items-center justify-between">
                <h3 className="font-semibold text-lg">¡Hablemos por WhatsApp!</h3>
                <button
                  onClick={handleToggle}
                  className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Contenido */}
              <div className="p-4">
                <p className="text-gray-600 text-sm mb-4">
                  Selecciona un contacto para iniciar una conversación
                </p>

                {/* Lista de contactos */}
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => handleContactSelect(contact)}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer rounded-lg border border-gray-200 transition-colors"
                    >
                      {/* Avatar con indicador online */}
                      <div className="relative">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
                          {contact.avatar}
                        </div>
                        {contact.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>

                      {/* Información del contacto */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                            {contact.role.split(' ')[0]}
                          </span>
                          <span className="font-semibold text-gray-900 truncate">
                            {contact.name}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm truncate">
                          {contact.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Disclaimer */}
                <div className="mt-4 text-center">
                  <p className="text-gray-500 text-xs">
                    Horario de atención: Lunes a Domingo 9:00 am - 5:00 pm
                  </p>
                </div>
              </div>
            </>
          ) : (
            // Vista de chat individual
            <>
              {/* Header del chat */}
              <div className="bg-green-500 text-white p-4 flex items-center gap-3">
                <button
                  onClick={handleBackToContacts}
                  className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>

                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
                    {selectedContact.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold">{selectedContact.name}</h4>
                    <p className="text-white/90 text-sm">{selectedContact.role}</p>
                  </div>
                </div>

                <button
                  onClick={handleToggle}
                  className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Área del mensaje */}
              <div className="p-4 bg-gray-50 h-96 flex flex-col">
                {/* Mensaje predefinido */}
                <div className="mb-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm max-w-[80%]">
                    <p className="text-gray-800">
                      ¡Hola! Si necesitas más información, no dudes en preguntar.
                    </p>
                  </div>
                </div>

                {/* Input de mensaje */}
                <div className="mt-auto">
                  <div className="flex items-start gap-2">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Escribe tu mensaje aquí..."
                      rows={3}
                      className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!message.trim()}
                      className={`p-3 rounded-lg transition-colors self-end ${message.trim()
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Estilos de animación */}
      <style jsx>{`
        @keyframes slide-in-bottom {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-in-bottom {
          animation: slide-in-bottom 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default WhatsAppComponent;