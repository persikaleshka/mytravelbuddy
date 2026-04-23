import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoute, useDeleteRoute } from '@/shared/api/hooks/routes';
import { useRouteMessages, useSendRouteMessage } from '@/shared/api/hooks/chat';
import { useRoutePage, useRouteMapData } from '@/shared/api/hooks/routes';
import { useQueryClient } from '@tanstack/react-query';
import WeatherDisplay from '@/widgets/weather-display';
import MapDisplay from '@/widgets/map-display';
import type { ChatMapPoint } from '@/entities/chat/types';
import type { MapPoint } from '@/shared/api/types/map';
import './TripChat.css';

// Объединяет маршрутные точки и AI-точки без дублирования по location_id
function computeMapPoints(
  mapData: { points: MapPoint[]; chat_suggestions: MapPoint[] } | undefined,
  latestChatPoints: ChatMapPoint[]
): MapPoint[] {
  const routePoints: MapPoint[] = mapData?.points ?? [];
  // Используем точки из последнего AI-ответа если они есть,
  // иначе берём chat_suggestions из кэша mapData
  const aiPoints: MapPoint[] = latestChatPoints.length > 0
    ? latestChatPoints
    : (mapData?.chat_suggestions ?? []);

  // Дедупликация: не добавляем AI-точку если такой location_id уже есть в маршруте
  const routeIds = new Set(routePoints.map(p => p.location_id));
  const uniqueAiPoints = aiPoints.filter(p => !routeIds.has(p.location_id));

  return [...routePoints, ...uniqueAiPoints];
}

const TripChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: route, isLoading: isRouteLoading, isError: isRouteError, error: routeError } = useRoute(id || '');
  const { mutate: deleteRoute } = useDeleteRoute();
  const { data: routePage, isLoading: isRoutePageLoading } = useRoutePage(id || '');
  const { data: mapData } = useRouteMapData(id || '');
  const { data: messages = [], isLoading: isMessagesLoading } = useRouteMessages(id || '');
  const { mutate: sendMessage, isPending: isSending, isError: isSendError, error: sendError } = useSendRouteMessage(id || '');
  const [newMessage, setNewMessage] = useState('');
  // Точки от последнего AI-ответа — показываются поверх маршрутных точек
  const [latestChatPoints, setLatestChatPoints] = useState<ChatMapPoint[]>([]);
  const hasScrolledToBottom = useRef(false);
  const lastMessageTextRef = useRef('');

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
      // При открытии страницы подтягиваем GET /api/routes/{id}/map и chat_suggestions
      queryClient.invalidateQueries({ queryKey: ['routes', 'map', id] });
    }
  }, [id, queryClient]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id) return;
    doSend(newMessage.trim());
  };

  const doSend = (text: string) => {
    if (!text || !id) return;
    lastMessageTextRef.current = text;
    sendMessage(
      { text },
      {
        onSuccess: (data) => {
          setNewMessage('');
          // Сохраняем точки последнего AI-ответа для немедленного отображения на карте
          if (data.map_points && data.map_points.length > 0) {
            setLatestChatPoints(data.map_points);
          }
          // Обновляем кэш карты чтобы chat_suggestions были актуальны после рефетча
          queryClient.setQueryData(['routes', 'map', id], (oldData: unknown) => {
            if (oldData && typeof oldData === 'object' && data.map_points) {
              const old = oldData as Record<string, unknown>;
              return { ...old, chat_suggestions: data.map_points };
            }
            return oldData;
          });

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
                    <div className={`message-text${message.sender === 'assistant' ? ' message-text--formatted' : ''}`}>
                      {message.sender === 'assistant' ? (message.formattedText || message.text) : message.text}
                    </div>
                    <div className="message-time">
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {isSendError && (
              <div className="error-message">
                {sendError?.message.includes('429') ? (
                  <>
                    <p>Слишком много запросов. Подождите немного и попробуйте снова.</p>
                    <button
                      onClick={() => doSend(lastMessageTextRef.current)}
                      className="retry-button"
                      disabled={isSending}
                    >
                      Повторить
                    </button>
                  </>
                ) : sendError?.message.toLowerCase().includes('timeout') || sendError?.message.toLowerCase().includes('network') ? (
                  <>
                    <p>Не удалось отправить сообщение. Проверьте соединение и попробуйте снова.</p>
                    <button
                      onClick={() => doSend(lastMessageTextRef.current)}
                      className="retry-button"
                      disabled={isSending}
                    >
                      Повторить
                    </button>
                  </>
                ) : (
                  <>
                    <p>Ошибка отправки сообщения. Попробуйте ещё раз.</p>
                    <button
                      onClick={() => doSend(lastMessageTextRef.current)}
                      className="retry-button"
                      disabled={isSending}
                    >
                      Повторить
                    </button>
                  </>
                )}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="message-input-container">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Спросите ассистента о маршруте..."
                className="message-input"
                disabled={isSending}
              />
              <button
                type="submit"
                className={`send-button${isSending ? ' send-button--loading' : ''}`}
                disabled={isSending || !newMessage.trim()}
              >
                {isSending ? 'Отправка...' : 'Отправить'}
              </button>
            </form>
          </div>
        </div>
        
        <div className="trip-content">
          <div className="trip-content-inner">
            <h2>Trip Details</h2>
            
            <div className="map-section">
              <MapDisplay
                points={computeMapPoints(mapData, latestChatPoints)}
                center={mapData?.center || null}
                city={mapData?.city || route?.city || ''}
              />
            </div>
            
            <div className="route-points-section">
              <h3>Места маршрута</h3>
              {(() => {
                const allMapPoints = computeMapPoints(mapData, latestChatPoints);
                const routePoints = routePage?.route_points ?? [];
                type DisplayPoint = { location_id: string; name: string; category: string; latitude: number; longitude: number; day?: number; day_number?: number; reason?: string };
                const displayPoints: DisplayPoint[] = routePoints.length > 0 ? routePoints : allMapPoints;

                if (!routePage && latestChatPoints.length === 0 && !mapData) {
                  return <p className="loading">Загрузка...</p>;
                }
                if (displayPoints.length === 0) {
                  return <p className="route-points-empty">Спросите ассистента — он предложит места и они появятся здесь</p>;
                }

                // Группируем по дням
                const grouped = new Map<number, DisplayPoint[]>();
                for (const point of displayPoints) {
                  const day = point.day ?? point.day_number ?? 0;
                  if (!grouped.has(day)) grouped.set(day, []);
                  grouped.get(day)!.push(point);
                }
                const sortedDays = Array.from(grouped.keys()).sort((a, b) => a - b);
                const hasMultipleDays = sortedDays.length > 1 || (sortedDays.length === 1 && sortedDays[0] > 0);

                const DAY_COLORS = ['#e05c5c','#4a90d9','#5cb85c','#f0a500','#9b59b6','#17a2b8','#e67e22','#2ecc71'];
                const colorForDay = (d: number) => d > 0 ? DAY_COLORS[(d - 1) % DAY_COLORS.length] : '#667b68';

                return (
                  <div className="route-points-list">
                    {sortedDays.map(day => (
                      <div key={day} className="route-day-group">
                        {hasMultipleDays && (
                          <div
                            className="route-day-header"
                            style={{ borderLeftColor: colorForDay(day) }}
                          >
                            {day > 0 ? `День ${day}` : 'Предложения'}
                          </div>
                        )}
                        {grouped.get(day)!.map((point, indexInDay) => (
                          <div key={point.location_id} className="route-point-item">
                            <div
                              className="point-icon"
                              style={{ backgroundColor: colorForDay(day) }}
                            >
                              {hasMultipleDays ? indexInDay + 1 : displayPoints.indexOf(point) + 1}
                            </div>
                            <div className="point-details">
                              <h4>{point.name}</h4>
                              <p className="point-meta">
                                {point.category}
                                {point.reason ? ` · ${point.reason}` : ''}
                              </p>
                            </div>
                            <button
                              className="show-on-map-button"
                              onClick={() => {
                                const found = allMapPoints.find(p => p.location_id === point.location_id) ?? point;
                                window.dispatchEvent(new CustomEvent('showPointOnMap', {
                                  detail: { latitude: found.latitude, longitude: found.longitude }
                                }));
                              }}
                            >
                              На карте
                            </button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()}
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