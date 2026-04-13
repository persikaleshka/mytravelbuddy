import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoute } from '@/shared/api/hooks/routes';
import { useRouteMessages, useSendRouteMessage } from '@/shared/api/hooks/chat';
import './TripChat.css';

const TripChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: route, isLoading: isRouteLoading, isError: isRouteError, error: routeError } = useRoute(id || '');
  const { data: messages = [], isLoading: isMessagesLoading } = useRouteMessages(id || '');
  const { mutate: sendMessage, isPending: isSending } = useSendRouteMessage(id || '');
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id) return;

    sendMessage(
      { text: newMessage.trim() },
      {
        onSuccess: () => {
          setNewMessage('');
        },
        onError: (error) => {
          console.error('Failed to send message:', error);
        }
      }
    );
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const isLoading = isRouteLoading || isMessagesLoading;

  if (isLoading) {
    return (
      <div className="trip-chat-page">
        <div className="trip-header">
          <button onClick={handleBack} className="back-button">
            ← Back to Trips
          </button>
          <div className="trip-info-header">
            <h1>{route?.name || 'Trip'}</h1>
          </div>
        </div>
        <div className="main-content">
          <div className="trip-sidebar">
            <div className="loading">Loading trip details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (isRouteError) {
    return (
      <div className="trip-chat-page">
        <div className="trip-header">
          <button onClick={handleBack} className="back-button">
            ← Back to Trips
          </button>
          <div className="trip-info-header">
            <h1>{route?.name || 'Trip'}</h1>
          </div>
        </div>
        <div className="main-content">
          <div className="trip-sidebar">
            <div className="error">
              Error loading trip: {routeError?.message || 'Unknown error'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="trip-chat-page">
      <div className="trip-header">
        <button onClick={handleBack} className="back-button">
          ← Back to Trips
        </button>
        <div className="trip-info-header">
          <h1>{route?.name || 'Trip'}</h1>
        </div>
      </div>
      
      <div className="main-content">
        <div className="trip-sidebar">
          <div className="chat-container">
            <div className="chat-header">
              Чат с ассистентом
            </div>
            <div className="messages-container">
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.sender}`}>
                  <div className="message-content">
                    <div className="message-text">{message.text}</div>
                    <div className="message-time">
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bottom-chat-window">
              <p>Дополнительная информация или элементы управления чатом</p>
            </div>

            <form onSubmit={handleSendMessage} className="message-input-container">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="message-input"
                disabled={isSending}
              />
              <button 
                type="submit" 
                className="send-button"
                disabled={isSending || !newMessage.trim()}
              >
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
        
        <div className="trip-content">
          <div className="trip-content-inner">
            <h2>Trip Details</h2>
            <p>Here you can display trip details, itinerary, maps, etc.</p>
            {/* This area can be expanded with more trip-related content */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripChatPage;