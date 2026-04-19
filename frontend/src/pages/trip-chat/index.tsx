import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoute, useDeleteRoute } from '@/shared/api/hooks/routes';
import { useRouteMessages, useSendRouteMessage } from '@/shared/api/hooks/chat';
import { useRoutePage, useRouteMapData } from '@/shared/api/hooks/routes';
import { useQueryClient } from '@tanstack/react-query';
import type { AssistantStructured as AssistantStructuredType } from '@/entities/chat/types';
import WeatherDisplay from '@/widgets/weather-display';
import MapDisplay from '@/widgets/map-display';
import AssistantStructured from '@/widgets/assistant-structured/AssistantStructured';
import './TripChat.css';

const TripChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: route, isLoading: isRouteLoading, isError: isRouteError, error: routeError } = useRoute(id || '');
  const { mutate: deleteRoute } = useDeleteRoute();
  const { data: routePage, isLoading: isRoutePageLoading } = useRoutePage(id || '');
  const { data: mapData, isLoading: isMapLoading } = useRouteMapData(id || '');
  const { data: messages = [], isLoading: isMessagesLoading } = useRouteMessages(id || '');
  const { mutate: sendMessage, isPending: isSending, isError: isSendError, error: sendError } = useSendRouteMessage(id || '');
  const [newMessage, setNewMessage] = useState('');
  const [assistantStructured, setAssistantStructured] = useState<AssistantStructuredType | null>(null);
  const hasScrolledToBottom = useRef(false);

  const scrollToBottom = () => {
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  };

  useEffect(() => {
    if (!isMessagesLoading && messages.length > 0 && !hasScrolledToBottom.current) {
      scrollToBottom();
      hasScrolledToBottom.current = true;
    }
  }, [messages, isMessagesLoading]);

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

  useEffect(() => {
    if (id) {
      queryClient.invalidateQueries({ queryKey: ['routes', 'map', id] });
    }
  }, [id, queryClient]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id) return;

    sendMessage(
      { text: newMessage.trim() },
      {
        onSuccess: (data) => {
          setNewMessage('');
          setAssistantStructured(data.assistant_structured);
          
          setTimeout(() => {
            scrollToBottom();
          }, 100);
          
          if (data.map_points && data.map_points.length > 0) {
            queryClient.setQueryData(['map', id], (oldData: unknown) => {
              if (oldData && typeof oldData === 'object' && data.map_points) {
                const oldDataObj = oldData as Record<string, unknown>;
                return {
                  ...oldDataObj,
                  points: [...(Array.isArray(oldDataObj.points) ? oldDataObj.points : []), ...data.map_points],
                  chat_suggestions: data.map_points
                };
              }
              return oldData;
            });
          }
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

  const handleDeleteTrip = () => {
    if (id && route && window.confirm(`Are you sure you want to delete trip "${route.name}"?`)) {
      deleteRoute(id, {
        onSuccess: () => {
          navigate('/dashboard');
        },
        onError: (error) => {
          console.error('Failed to delete trip:', error);
          alert('Failed to delete trip. Please try again.');
        }
      });
    }
  };

  const isLoading = isRouteLoading || isMessagesLoading || isRoutePageLoading;

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
        <button onClick={handleDeleteTrip} className="delete-button">
          Delete Trip
        </button>
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
                    <div className="message-text">
                      {message.formattedText || message.text}
                    </div>
                    <div className="message-time">
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              
              {assistantStructured && Object.keys(assistantStructured).length > 0 && (
                <AssistantStructured 
                  structured={assistantStructured} 
                  onShowOnMap={(point) => {
                    console.log('Show on map:', point);
                  }} 
                />
              )}
            </div>
            
            <div className="bottom-chat-window">
              <p>Дополнительная информация или элементы управления чатом</p>
            </div>

            {isSendError && (
              <div className="error-message">
                {sendError?.message.includes('429') ? (
                  <>
                    <p>Too many requests. Please wait a moment and try again.</p>
                    <button onClick={() => sendMessage({ text: newMessage.trim() })} className="retry-button">
                      Retry
                    </button>
                  </>
                ) : (
                  <p>Error sending message: {sendError?.message || 'Unknown error'}</p>
                )}
              </div>
            )}

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
            
            <div className="map-section">
              {(mapData && !isMapLoading) ? (
                <MapDisplay 
                  points={[...mapData.points, ...mapData.chat_suggestions]}
                  center={mapData.center}
                  city={mapData.city}
                />
              ) : (
                <div className="map-placeholder">
                  <p>Loading map data...</p>
                </div>
              )}
            </div>
            
            <div className="route-points-section">
              <h3>Route Points</h3>
              {routePage ? (
                <div className="route-points-list">
                  {routePage.route_points.map((point, index) => (
                    <div key={point.location_id} className="route-point-item">
                      <div className="point-icon">{index + 1}</div>
                      <div className="point-details">
                        <h4>{point.name}</h4>
                        <p>{point.category} • {routePage.route.city}</p>
                      </div>
                      <button 
                        className="show-on-map-button"
                        onClick={() => {
                          if (mapData) {
                            const mapPoints = [...mapData.points, ...mapData.chat_suggestions];
                            const mapPoint = mapPoints.find(p => p.location_id === point.location_id);
                            if (mapPoint) {
                              const event = new CustomEvent('showPointOnMap', { 
                                detail: { 
                                  latitude: mapPoint.latitude, 
                                  longitude: mapPoint.longitude 
                                } 
                              });
                              window.dispatchEvent(event);
                            }
                          }
                        }}
                      >
                        Показать на карте
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Loading route points...</p>
              )}
            </div>
            
            <div className="weather-section">
              {routePage ? (
                <WeatherDisplay weatherData={routePage.weather.data} />
              ) : (
                <div className="weather-placeholder">
                  <p>Loading weather data...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripChatPage;