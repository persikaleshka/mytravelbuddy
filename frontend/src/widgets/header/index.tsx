import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/shared/contexts/auth-context';
import './Header.css';

const Header: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-logo">
          <Link to="/">MyTravelBuddy</Link>
        </div>
        <div className="header-actions">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="btn btn-outline">
                {t('header.allTrips')}
              </Link>
              <Link to="/profile" className="btn btn-outline">
                {t('header.profile')}
              </Link>
            </>
          ) : (
            <Link to="/login" className="btn btn-outline">
              {t('header.login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
