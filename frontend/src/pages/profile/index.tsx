import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/contexts/auth-context';
import './Profile.css';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Get account settings from localStorage
  const accountSettings = {
    interests: localStorage.getItem('userInterests') || 'Not set',
    budget: localStorage.getItem('userBudget') || 'Not set',
    tripStyle: localStorage.getItem('userTripStyle') || 'Not set'
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleAccountSettings = () => {
    navigate('/account');
  };

  // Format budget display
  const formatBudget = (budget: string) => {
    switch (budget) {
      case 'low': return 'Low ($ - $500)';
      case 'medium': return 'Medium ($500 - $1500)';
      case 'high': return 'High ($1500+)';
      default: return budget;
    }
  };

  // Format trip style display
  const formatTripStyle = (style: string) => {
    switch (style) {
      case 'adventure': return 'Adventure';
      case 'relaxation': return 'Relaxation';
      case 'cultural': return 'Cultural';
      case 'luxury': return 'Luxury';
      case 'backpacking': return 'Backpacking';
      default: return style;
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>Profile</h1>
        
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <span>{user?.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="profile-info">
              <h2>{user?.name}</h2>
              <p>{user?.email}</p>
            </div>
          </div>
          
          <div className="account-details">
            <h3>Travel Preferences</h3>
            <div className="detail-item">
              <span className="detail-label">Interests:</span>
              <span className="detail-value">{accountSettings.interests}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Budget:</span>
              <span className="detail-value">{formatBudget(accountSettings.budget)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Trip Style:</span>
              <span className="detail-value">{formatTripStyle(accountSettings.tripStyle)}</span>
            </div>
          </div>
          
          <div className="profile-actions">
            <button 
              className="btn btn-primary"
              onClick={handleAccountSettings}
              style={{ marginRight: '1rem' }}
            >
              Edit
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;