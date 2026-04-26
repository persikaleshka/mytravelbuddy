import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/shared/contexts/auth-context';
import './Profile.css';

const LANG_LABELS: Record<string, string> = {
  ru: 'Русский',
  en: 'English',
};

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();

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
