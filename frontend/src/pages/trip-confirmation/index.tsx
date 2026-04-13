import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TripConfirmation.css';

const TripConfirmationPage: React.FC = () => {
  const navigate = useNavigate();

  const handleViewTrips = () => {
    navigate('/dashboard');
  };

  return (
    <div className="trip-confirmation-page">
      <div className="trip-confirmation-container">
        <div className="confirmation-content">
          <h1>Trip Created Successfully!</h1>
          <p>Your trip has been created and saved to your account.</p>
          <div className="confirmation-actions">
            <button 
              className="btn btn-outline"
              onClick={handleViewTrips}
            >
              View All Trips
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/create-trip')}
            >
              Create Another Trip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripConfirmationPage;