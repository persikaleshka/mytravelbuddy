import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-logo">
          <Link to="/">MyTravelBuddy</Link>
        </div>
        <nav className="header-nav">
        </nav>
        <div className="header-actions">
          <Link to="/login" className="btn btn-outline">Log in</Link>
        </div>
      </div>
    </header>
  );
};

export default Header;