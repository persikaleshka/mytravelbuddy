import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Account.css';

const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Get user info from localStorage
  const user = {
    name: localStorage.getItem('userName') || 'User',
    email: localStorage.getItem('userEmail') || 'user@example.com'
  };

  // Account settings state
  const [interests, setInterests] = useState<string>(localStorage.getItem('userInterests') || '');
  const [budget, setBudget] = useState<string>(localStorage.getItem('userBudget') || '');
  const [tripStyle, setTripStyle] = useState<string>(localStorage.getItem('userTripStyle') || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleSave = () => {
    setIsSaving(true);
    
    // Save to localStorage
    localStorage.setItem('userInterests', interests);
    localStorage.setItem('userBudget', budget);
    localStorage.setItem('userTripStyle', tripStyle);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      // Navigate to profile page after saving
      setTimeout(() => {
        navigate('/profile');
      }, 1000);
    }, 1000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userInterests');
    localStorage.removeItem('userBudget');
    localStorage.removeItem('userTripStyle');
    navigate('/');
  };

  return (
    <div className="account-page">
      <div className="account-container">
        <h1>Account Settings</h1>
        
        <div className="account-card">
          <div className="account-header">
            <div className="account-avatar">
              <span>{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="account-info">
              <h2>{user.name}</h2>
              <p>{user.email}</p>
            </div>
          </div>
          
          <div className="account-form">
            <div className="form-group">
              <label htmlFor="interests">Interests</label>
              <textarea
                id="interests"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="What are your travel interests? (e.g., hiking, museums, food, beaches)"
                rows={4}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="budget">Budget</label>
              <select
                id="budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              >
                <option value="">Select your budget range</option>
                <option value="low">Low ($ - $500)</option>
                <option value="medium">Medium ($500 - $1500)</option>
                <option value="high">High ($1500+)</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="tripStyle">Style of Trip</label>
              <select
                id="tripStyle"
                value={tripStyle}
                onChange={(e) => setTripStyle(e.target.value)}
              >
                <option value="">Select your preferred trip style</option>
                <option value="adventure">Adventure</option>
                <option value="relaxation">Relaxation</option>
                <option value="cultural">Cultural</option>
                <option value="luxury">Luxury</option>
                <option value="backpacking">Backpacking</option>
              </select>
            </div>
            
            <div className="account-actions">
              <button 
                className="btn btn-outline"
                onClick={handleLogout}
              >
                Logout
              </button>
              {!isSaved ? (
                <button 
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
              ) : (
                <div className="save-success">
                  Settings saved successfully! Redirecting to profile...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;