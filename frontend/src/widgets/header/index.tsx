import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  // For now, we'll implement a simple check for token
  // In a real app, this would be handled by an auth context or hook
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-logo">
          <Link to="/">MyTravelBuddy</Link>
        </div>
        <nav className="header-nav">
        </nav>
        <div className="header-actions">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="btn btn-outline">
                All Trips
              </Link>
              <Link to="/profile" className="btn user-btn">
                Profile
              </Link>
            </>
          ) : (
            <Link to="/login" className="btn btn-outline">Log in</Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;