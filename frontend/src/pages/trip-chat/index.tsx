import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AssistantStructured from '@/widgets/assistant-structured/AssistantStructured';
import type { ChatMapPoint } from '@/entities/chat/types';
import { useRoute, useDeleteRoute, useRoutePage, useRouteMapData } from '@/shared/api/hooks/routes';
import { useRouteMessages, useSendRouteMessage } from '@/shared/api/hooks/chat';
import WeatherDisplay from '@/widgets/weather-display';
import MapDisplay from '@/widgets/map-display';
import type { MapPoint } from '@/shared/api/types/map';
import './TripChat.css';


const DAY_COLORS = ['#e05c5c', '#4a90d9', '#5cb85c', '#f0a500', '#9b59b6', '#17a2b8', '#e67e22', '#2ecc71'];
const colorForDay = (d: number) => d > 0 ? DAY_COLORS[(d - 1) % DAY_COLORS.length] : '#667b68';

const TripChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isNewTrip = (location.state as { isNew?: boolean } | null)?.isNew === true;

  const { data: route, isLoading: isRouteLoading, isError: isRouteError, error: routeError } = useRoute(id || '');
  const { mutate: deleteRoute } = useDeleteRoute();
  const { data: messages = [], isLoading: isMessagesLoading } = useRouteMessages(id || '');

  const hasMessages = messages.length > 0;
  const shouldFetchDetails = !isNewTrip || hasMessages;

  const { data: routePage } = useRoutePage(
    shouldFetchDetails ? (id || '') : ''
  );
  const { data: mapData } = useRouteMapData(
    shouldFetchDetails ? (id || '') : ''
  );
  const { mutate: sendMessage, isPending: isSending, isError: isSendError, error: sendError } = useSendRouteMessage(id || '');

  const [newMessage, setNewMessage] = useState('');
  const lastMessageTextRef = useRef('');
  const hasScrolledToBottom = useRef(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    if (!isMessagesLoading && messages.length > 0 && !hasScrolledToBottom.current) {
      scrollToBottom();
      hasScrolledToBottom.current = true;
    }
  }, [messages, isMessagesLoading]);

  useEffect(() => {
    if (!hasScrolledToBottom.current) return;
    const el = messagesContainerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollTop + clientHeight >= scrollHeight - 100) scrollToBottom();
  }, [messages]);

  useEffect(() => {
    hasScrolledToBottom.current = false;
  }, [id]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id) return;
    doSend(newMessage.trim());
  };

  const doSend = (text: string) => {
    if (!text || !id) return;
    lastMessageTextRef.current = text;
    sendMessage(
      { text, lang: i18n.language },
      {
        onSuccess: () => {
          setNewMessage('');
          setTimeout(scrollToBottom, 100);
        },
        onError: (error) => {
          console.error('Failed to send message:', error);
        },
      },
    );
  };

  const handleBack = () => navigate('/dashboard');

  const handleDeleteTrip = () => {
    if (id && route && window.confirm(t('tripChat.deleteTripConfirm', { name: route.name }))) {
      deleteRoute(id, {
        onSuccess: () => navigate('/dashboard'),
        onError: (error) => {
          console.error('Failed to delete trip:', error);
          alert(t('tripChat.deleteFailed'));
        },
      });
    }
  };

  const routeReady     = !!route     && route.id            === id;
  const routePageReady = !!routePage && routePage.route?.id === id;
  const mapDataReady   = !!mapData   && mapData.routeId     === id;

  const isLoading = isRouteLoading || isMessagesLoading || !routeReady;

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString() : '';
  const routeDateRange = route
    ? `${route.city} • ${formatDate(route.start_date)} — ${formatDate(route.end_date)}`
    : '';

  if (isLoading) {
    return (
      <div className="trip-chat-page">
        <div className="trip-header">
          <button onClick={handleBack} className="back-button">{t('tripChat.backToTrips')}</button>
          <div className="trip-info-header">
            <h1>{route?.name || 'Trip'}</h1>
            <p>{routeDateRange}</p>
          </div>
        </div>
        <div className="main-content">
          <div className="trip-sidebar">
            <div className="loading">{t('tripChat.loading')}</div>
          </div>
        </div>
      </div>
    );
  }

  if (isRouteError) {
    return (
      <div className="trip-chat-page">
        <div className="trip-header">
          <button onClick={handleBack} className="back-button">{t('tripChat.backToTrips')}</button>
          <div className="trip-info-header">
            <h1>{route?.name || 'Trip'}</h1>
            <p>{routeDateRange}</p>
          </div>
        </div>
        <div className="main-content">
          <div className="trip-sidebar">
            <div className="error">{t('tripChat.errorLoading', { message: routeError?.message || t('tripChat.errorDefault') })}</div>
          </div>
        </div>
      </div>
    );
  }

  const safeMapData   = mapDataReady   ? mapData   : undefined;
  const safeRoutePage = routePageReady ? routePage : undefined;

  type DisplayPoint = MapPoint & { day?: number; day_number?: number; reason?: string };

  const confirmedPoints: DisplayPoint[] = safeRoutePage?.route_points ?? [];
  const aiSuggestions: DisplayPoint[] = safeMapData?.chat_suggestions ?? [];
  const displayPoints: DisplayPoint[] = [
    ...confirmedPoints,
    ...aiSuggestions.filter(p => !confirmedPoints.some(r => r.location_id === p.location_id)),
  ];
  const allMapPoints: MapPoint[] = displayPoints;

  const grouped = new Map<number, DisplayPoint[]>();
  for (const point of displayPoints) {
    const day = point.day ?? point.day_number ?? 0;
    if (!grouped.has(day)) grouped.set(day, []);
    grouped.get(day)!.push(point);
  }
  const sortedDays = Array.from(grouped.keys()).sort((a, b) => a - b);
  const hasMultipleDays = sortedDays.length > 1 || (sortedDays.length === 1 && sortedDays[0] > 0);

  return (
    <div className="trip-chat-page">
      <div className="trip-header">
          <button onClick={handleBack} className="back-button">{t('tripChat.backToTrips')}</button>
        <div className="trip-info-header">
          <h1>{route?.name || 'Trip'}</h1>
          <p>
            {route?.city}
            {route?.start_date ? ` • ${new Date(route.start_date).toLocaleDateString()}` : ''}
            {route?.end_date ? ` — ${new Date(route.end_date).toLocaleDateString()}` : ''}
          </p>
        </div>
        <button onClick={handleDeleteTrip} className="delete-button">{t('tripChat.deleteTrip')}</button>
      </div>

      <div className="main-content">
        <div className="trip-sidebar">
          <div className="chat-container">
            <div className="chat-header">{t('tripChat.chat')}</div>

            <div className="messages-container" ref={messagesContainerRef}>
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.sender}`}>
                  <div className="message-content">
                    <div className={`message-text${message.sender === 'assistant' ? ' message-text--formatted' : ''}`}>
                      {message.sender === 'assistant'
                        ? <>
                            {message.assistantStructured && Object.keys(message.assistantStructured).length > 0 && (
                              <AssistantStructured
                                structured={message.assistantStructured}
                                onShowOnMap={(point: ChatMapPoint) => {
                                  window.dispatchEvent(new CustomEvent('showPointOnMap', {
                                    detail: { latitude: point.latitude, longitude: point.longitude },
                                  }));
                                }}
                              />
                            )}
                            {(!message.assistantStructured || Object.keys(message.assistantStructured).length === 0) && (
                              <span style={{ whiteSpace: 'pre-wrap' }}>{message.formattedText || message.text}</span>
                            )}
                          </>
                        : message.text}
                    </div>
                    <div className="message-time">
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {isSendError && !sendError?.message.toLowerCase().includes('timeout') && !(sendError as unknown as { code?: string })?.code?.includes('ECONNABORTED') && (
              <div className="error-message">
                {sendError?.message.includes('429') ? (
                  <>
                    <p>{t('tripChat.errorTooManyRequests')}</p>
                    <button onClick={() => doSend(lastMessageTextRef.current)} className="retry-button" disabled={isSending}>
                      {t('tripChat.retry')}
                    </button>
                  </>
                ) : (
                  <>
                    <p>{t('tripChat.errorSend')}</p>
                    <button onClick={() => doSend(lastMessageTextRef.current)} className="retry-button" disabled={isSending}>
                      {t('tripChat.retry')}
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
                placeholder={t('tripChat.inputPlaceholder')}
                className="message-input"
                disabled={isSending}
              />
              <button
                type="submit"
                className={`send-button${isSending ? ' send-button--loading' : ''}`}
                disabled={isSending || !newMessage.trim()}
              >
                {isSending ? t('tripChat.sending') : t('tripChat.send')}
              </button>
            </form>
          </div>
        </div>

        <div className="trip-content">
          <div className="trip-content-inner">
            <h2>{t('tripChat.tripDetails')}</h2>

            <div className="map-section">
              <MapDisplay
                points={allMapPoints}
                center={safeMapData?.center ?? null}
                city={safeMapData?.city ?? route?.city ?? ''}
              />
            </div>

            <div className="route-points-section">
              <h3>{t('tripChat.routePoints')}</h3>

              {displayPoints.length === 0 ? (
                <p className="route-points-empty">
                  {t('tripChat.routePointsEmpty')}
                </p>
              ) : (
                <div className="route-points-list">
                  {sortedDays.map(day => (
                    <div key={day} className="route-day-group">
                      {hasMultipleDays && (
                        <div className="route-day-header" style={{ borderLeftColor: colorForDay(day) }}>
                          {day > 0 ? t('tripChat.dayLabel', { day }) : t('tripChat.suggestions')}
                        </div>
                      )}
                      {grouped.get(day)!.map((point, i) => (
                        <div key={`${point.location_id}-${day}`} className="route-point-item">
                          <div className="point-icon" style={{ backgroundColor: colorForDay(day) }}>
                            {hasMultipleDays ? i + 1 : displayPoints.indexOf(point) + 1}
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
                              window.dispatchEvent(new CustomEvent('showPointOnMap', {
                                detail: { latitude: point.latitude, longitude: point.longitude },
                              }));
                            }}
                          >
                            {t('tripChat.showOnMap')}
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="weather-section">
              {safeRoutePage ? (
                <WeatherDisplay weatherData={safeRoutePage.weather.data} />
              ) : (
                <div className="weather-placeholder">
                  <p>{t('tripChat.weatherLoading')}</p>
                </div>
              )}
            </div>

            {route?.start_date && route?.end_date && (
              <div className="tickets-section">
                <h3>{t('tripChat.tickets')}</h3>
                <a
                  href={`https://travel.yandex.ru/avia/c213--anywhere/?adult_seats=1&children_seats=0&infant_seats=0&klass=economy&oneway=2&return_date=${route.end_date}&when=${route.start_date}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tickets-link"
                >
                  {t('tripChat.ticketsLink')}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripChatPage;
