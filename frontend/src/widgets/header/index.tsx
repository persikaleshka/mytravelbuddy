import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/shared/contexts/auth-context';
import './Header.css';

const Header: React.FC = () => {
  const { isAuthenticated } = useAuth();

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
              <Link to="/profile" className="btn btn-outline">
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