import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/shared/contexts/auth-context';
import './Home.css';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">{t('home.heroTitle')}</h1>
          <p className="hero-subtitle">{t('home.heroSubtitle')}</p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-large" onClick={() => navigate('/login')}>
              {t('home.getStarted')}
            </button>
          </div>
        </div>
      </section>

      <section className="middle-section">
        <div className="middle-content">
          <h2>MyTravelBuddy</h2>
          <p>{t('home.welcomeSubtitle')}</p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
