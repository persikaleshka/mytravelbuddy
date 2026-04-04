import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRoutes } from '@/shared/api/hooks/routes';
import './Dashboard.css';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: routes, isPending, isError, error } = useUserRoutes();

  const handleCreateTrip = () => {
    navigate('/create-trip');
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>My Trips</h1>
        <button 
          className="btn btn-primary" 
          onClick={handleCreateTrip}
        >
          Create Trip
        </button>
      </div>

      {isPending && (
        <div className="loading-state">
          <p>Loading your trips...</p>
        </div>
      )}

      {isError && (
        <div className="error-state">
          <p>Error loading trips: {error?.message || 'Unknown error'}</p>
        </div>
      )}

      {routes && routes.length === 0 && (
        <div className="empty-state">
          <p>You don't have any trips yet.</p>
          <button 
            className="btn btn-primary" 
            onClick={handleCreateTrip}
          >
            Create your first trip
          </button>
        </div>
      )}

      {routes && routes.length > 0 && (
        <div className="routes-list">
          {routes.map((route) => (
            <div key={route.id} className="route-card">
              <h3>{route.name}</h3>
              <p>{route.description}</p>
              <div className="route-meta">
                <span>Created: {new Date(route.createdAt).toLocaleDateString()}</span>
                <span>Locations: {route.locations.length}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;