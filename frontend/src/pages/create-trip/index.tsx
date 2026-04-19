import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { mutate: createRoute, isPending, isError, error } = useCreateRoute();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Преобразуем даты в нужный формат
    const formattedStartDate = startDate ? new Date(startDate).toISOString().split('T')[0] : '';
    const formattedEndDate = endDate ? new Date(endDate).toISOString().split('T')[0] : '';
    
    // Преобразуем предпочтения в массив location_ids (заглушка)
    const locationIds = preferences ? preferences.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [];
    
    // Создаем объект items для отправки на бэкенд
    const items = locationIds.map((locationId, index) => ({
      location_id: locationId,
      day_number: 1,
      order_in_day: index + 1
    }));
    
    createRoute(
      { 
        name, 
        city,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        items
      } as CreateRouteRequest,
      {
        onSuccess: (createdRoute) => {
          navigate(`/trip/${createdRoute.id}`);
        },
        onError: (err) => {
          console.error('Failed to create trip:', err);
        }
      }
    );
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="create-trip-page">
      <div className="create-trip-container">
        <h1>Create New Trip</h1>
        
        <form onSubmit={handleSubmit} className="create-trip-form">
          <div className="form-group">
            <label htmlFor="name">Trip Name</label>
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
            <label htmlFor="city">City</label>
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
              <label htmlFor="start-date">Start Date</label>
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
              <label htmlFor="end-date">End Date</label>
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
            <label htmlFor="preferences">Preferences</label>
            <textarea
              id="preferences"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="Enter location IDs separated by commas (e.g., 1, 2, 3)"
              rows={4}
            />
            <p className="form-help">Enter location IDs separated by commas</p>
          </div>
          
          {isError && (
            <div className="error-message">
              Error creating trip: {error?.message || 'Unknown error'}
            </div>
          )}
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handleCancel}
              disabled={isPending}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isPending}
            >
              {isPending ? 'Creating...' : 'Create Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTripPage;