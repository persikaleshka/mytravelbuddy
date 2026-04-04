import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateRoute } from '@/shared/api/hooks/routes';
import './CreateTrip.css';

const CreateTripPage: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const navigate = useNavigate();
  const { mutate: createRoute, isPending, isError, error } = useCreateRoute();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createRoute(
      { name, description, locations },
      {
        onSuccess: () => {
          navigate('/dashboard');
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
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={isError ? 'error' : ''}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="locations">Locations</label>
            <input
              type="text"
              id="locations"
              placeholder="Enter location IDs separated by commas"
              value={locations.join(', ')}
              onChange={(e) => setLocations(e.target.value.split(',').map(id => id.trim()).filter(id => id))}
            />
            <p className="form-help">Enter location IDs separated by commas (e.g., 1, 2, 3)</p>
          </div>
          
          {isError && (
            <div className="error-message">
              Error creating trip: {error?.message || 'Unknown error'}
            </div>
          )}
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-outline"
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