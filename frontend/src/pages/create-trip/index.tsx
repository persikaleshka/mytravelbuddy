import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateRoute } from '@/shared/api/hooks/routes';
import type { CreateRouteRequest } from '@/shared/api/types/routes';
import './CreateTrip.css';

const CreateTripPage: React.FC = () => {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [preferences, setPreferences] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { mutate: createRoute, isPending, isError, error } = useCreateRoute();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedStartDate = startDate ? new Date(startDate).toISOString().split('T')[0] : '';
    const formattedEndDate = endDate ? new Date(endDate).toISOString().split('T')[0] : '';

    createRoute(
      { name, city, start_date: formattedStartDate, end_date: formattedEndDate, items: [] } as CreateRouteRequest,
      {
        onSuccess: (createdRoute) => {
          queryClient.removeQueries({ queryKey: ['routes', createdRoute.id] });
          queryClient.removeQueries({ queryKey: ['routes', 'page', createdRoute.id] });
          queryClient.removeQueries({ queryKey: ['routes', 'map', createdRoute.id] });
          queryClient.removeQueries({ queryKey: ['chat', createdRoute.id] });
          navigate(`/trip/${createdRoute.id}`, { state: { isNew: true } });
        },
        onError: (err) => {
          console.error('Failed to create trip:', err);
        },
      }
    );
  };

  return (
    <div className="create-trip-page">
      <div className="create-trip-container">
        <h1>{t('createTrip.title')}</h1>

        <form onSubmit={handleSubmit} className="create-trip-form">
          <div className="form-group">
            <label htmlFor="name">{t('createTrip.tripName')}</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={isError ? 'error' : ''}
            />
          </div>

          <div className="form-group">
            <label htmlFor="city">{t('createTrip.city')}</label>
            <input
              type="text"
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className={isError ? 'error' : ''}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start-date">{t('createTrip.startDate')}</label>
              <input
                type="date"
                id="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className={isError ? 'error' : ''}
              />
            </div>
            <div className="form-group">
              <label htmlFor="end-date">{t('createTrip.endDate')}</label>
              <input
                type="date"
                id="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className={isError ? 'error' : ''}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="preferences">{t('createTrip.interests')}</label>
            <textarea
              id="preferences"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder={t('createTrip.interestsPlaceholder')}
              rows={3}
            />
          </div>

          {isError && (
            <div className="error-message">
              {t('createTrip.errorCreating', { message: error?.message || t('createTrip.errorDefault') })}
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard')} disabled={isPending}>
              {t('createTrip.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={isPending}>
              {isPending ? t('createTrip.submitting') : t('createTrip.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTripPage;
