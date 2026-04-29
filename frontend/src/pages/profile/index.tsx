import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/shared/contexts/auth-context';
import { useUserRoutes } from '@/shared/api/hooks/routes';
import './Profile.css';

const LANG_LABELS: Record<string, string> = {
  ru: 'Русский',
  en: 'English',
};

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { data: routes = [] } = useUserRoutes();

  const accountSettings = {
    interests: localStorage.getItem('userInterests') || t('profile.notSet'),
    budget: localStorage.getItem('userBudget') || '',
    tripStyle: localStorage.getItem('userTripStyle') || '',
  };

  const formatBudget = (budget: string) => {
    if (!budget) return t('profile.notSet');
    const key = `profile.budget_${budget}`;
    const translated = t(key);
    return translated === key ? budget : translated;
  };

  const formatTripStyle = (style: string) => {
    if (!style) return t('profile.notSet');
    const key = `profile.style_${style}`;
    const translated = t(key);
    return translated === key ? style : translated;
  };

  const totalTrips = routes.length;

  const totalDays = routes.reduce((sum, r) => {
    if (!r.start_date || !r.end_date) return sum;
    const diff = Math.round(
      (new Date(r.end_date).getTime() - new Date(r.start_date).getTime()) / 86_400_000,
    );
    return sum + (diff > 0 ? diff : 0);
  }, 0);

  const top3Cities = Object.entries(
    routes.reduce((acc, r) => {
      if (r.city) acc[r.city] = (acc[r.city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([city]) => city);

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>{t('profile.title')}</h1>

        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <span>{user?.name?.charAt(0)?.toUpperCase() ?? '?'}</span>
            </div>
            <div className="profile-info">
              <h2>{user?.name}</h2>
              <p>{user?.email}</p>
            </div>
          </div>

          {totalTrips > 0 && (
            <div className="account-details profile-stats">
              <h3>{t('profile.stats')}</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-value">{totalTrips}</span>
                  <span className="stat-label">{t('profile.totalTrips')}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{totalDays}</span>
                  <span className="stat-label">{t('profile.totalDays')}</span>
                </div>
              </div>
              {top3Cities.length > 0 && (
                <div className="top-cities">
                  <span className="detail-label">{t('profile.topCities')}</span>
                  <div className="city-tags">
                    {top3Cities.map(city => (
                      <span key={city} className="city-tag">{city}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="account-details">
            <h3>{t('profile.travelPreferences')}</h3>
            <div className="detail-item">
              <span className="detail-label">{t('profile.interests')}</span>
              <span className="detail-value">{accountSettings.interests}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">{t('profile.budget')}</span>
              <span className="detail-value">{formatBudget(accountSettings.budget)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">{t('profile.tripStyle')}</span>
              <span className="detail-value">{formatTripStyle(accountSettings.tripStyle)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">{t('account.language')}</span>
              <span className="detail-value">{LANG_LABELS[i18n.language] ?? i18n.language}</span>
            </div>
          </div>

          <div className="profile-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/account')}
              style={{ marginRight: '1rem' }}
            >
              {t('profile.edit')}
            </button>
            <button className="btn btn-primary" onClick={logout}>
              {t('profile.logout')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
