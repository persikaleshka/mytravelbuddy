import React, { useState, useRef, useEffect } from 'react';
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
  const hasScrolledToBottom = useRef(false);

  // Scroll to bottom once when messages are loaded
  useEffect(() => {
    if (!isMessagesLoading && messages.length > 0 && !hasScrolledToBottom.current) {
      scrollToBottom();
      hasScrolledToBottom.current = true;
    }
  }, [messages, isMessagesLoading]);

  // Auto-scroll to bottom when new messages are added (only if user is near bottom)
  useEffect(() => {
    if (hasScrolledToBottom.current && messages.length > 0) {
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
        
        if (isNearBottom) {
          scrollToBottom();
        }
      }
    }
  }, [messages]);

  const scrollToBottom = () => {
    // Scroll only the messages container, not the whole page
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id) return;

    sendMessage(
      { text: newMessage.trim() },
      {
        onSuccess: () => {
          setNewMessage('');
          // Scroll to bottom when sending a new message
          setTimeout(() => {
            scrollToBottom();
          }, 100);
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
            <p>{route?.city} • {route?.start_date} to {route?.end_date}</p>
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
            <p>{route?.city} • {route?.start_date} to {route?.end_date}</p>
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
          <p>{route?.city} • {route?.start_date} to {route?.end_date}</p>
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
            
            {/* Map Section */}
            <div className="map-section">
              <h3>Route Map</h3>
              <div className="map-placeholder">
                <p>Map will be displayed here</p>
                <div className="map-container">
                  {/* Map placeholder content */}
                  <div className="map-marker" style={{top: '30%', left: '40%'}}>📍</div>
                  <div className="map-marker" style={{top: '50%', left: '60%'}}>📍</div>
                  <div className="map-marker" style={{top: '70%', left: '30%'}}>📍</div>
                </div>
              </div>
            </div>
            
            {/* Route Points Section */}
            <div className="route-points-section">
              <h3>Route Points</h3>
              <div className="route-points-list">
                <div className="route-point-item">
                  <div className="point-icon">1</div>
                  <div className="point-details">
                    <h4>Tretyakov Gallery</h4>
                    <p>Museum • Moscow</p>
                  </div>
                </div>
                <div className="route-point-item">
                  <div className="point-icon">2</div>
                  <div className="point-details">
                    <h4>Red Square</h4>
                    <p>Historical site • Moscow</p>
                  </div>
                </div>
                <div className="route-point-item">
                  <div className="point-icon">3</div>
                  <div className="point-details">
                    <h4>GUM Department Store</h4>
                    <p>Shopping • Moscow</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Weather Section */}
            <div className="weather-section">
              <h3>Weather Forecast</h3>
              <div className="weather-placeholder">
                <p>Weather information will be displayed here</p>
                <div className="weather-content">
                  <div className="weather-day">
                    <p>Today</p>
                    <div className="weather-icon">☀️</div>
                    <p>22°C</p>
                  </div>
                  <div className="weather-day">
                    <p>Tomorrow</p>
                    <div className="weather-icon">⛅</div>
                    <p>18°C</p>
                  </div>
                  <div className="weather-day">
                    <p>Day 3</p>
                    <div className="weather-icon">🌧️</div>
                    <p>15°C</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripChatPage;