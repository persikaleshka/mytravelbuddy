import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/shared/contexts/auth-context';
import LangToggle from '@/shared/components/LangToggle';
import './Account.css';

const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user: authUser, logout } = useAuth();

  const user = {
    name: authUser?.name || 'User',
    email: authUser?.email || '',
  };

  const [interests, setInterests] = useState<string>(localStorage.getItem('userInterests') || '');
  const [budget, setBudget] = useState<string>(localStorage.getItem('userBudget') || '');
  const [tripStyle, setTripStyle] = useState<string>(localStorage.getItem('userTripStyle') || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem('userInterests', interests);
    localStorage.setItem('userBudget', budget);
    localStorage.setItem('userTripStyle', tripStyle);
    setIsSaving(false);
    setIsSaved(true);
    navigate('/profile');
  };

  const handleLogout = () => {
    localStorage.removeItem('userInterests');
    localStorage.removeItem('userBudget');
    localStorage.removeItem('userTripStyle');
    logout();
  };

  return (
    <div className="account-page">
      <div className="account-container">
        <h1>{t('account.title')}</h1>

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
              <label htmlFor="interests">{t('account.interests')}</label>
              <textarea
                id="interests"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder={t('account.interestsPlaceholder')}
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="budget">{t('account.budget')}</label>
              <select id="budget" value={budget} onChange={(e) => setBudget(e.target.value)}>
                <option value="">{t('account.budgetPlaceholder')}</option>
                <option value="low">{t('account.budget_low')}</option>
                <option value="medium">{t('account.budget_medium')}</option>
                <option value="high">{t('account.budget_high')}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t('account.language')}</label>
              <LangToggle />
            </div>

            <div className="form-group">
              <label htmlFor="tripStyle">{t('account.tripStyle')}</label>
              <select id="tripStyle" value={tripStyle} onChange={(e) => setTripStyle(e.target.value)}>
                <option value="">{t('account.tripStylePlaceholder')}</option>
                <option value="adventure">{t('account.style_adventure')}</option>
                <option value="relaxation">{t('account.style_relaxation')}</option>
                <option value="cultural">{t('account.style_cultural')}</option>
                <option value="luxury">{t('account.style_luxury')}</option>
                <option value="backpacking">{t('account.style_backpacking')}</option>
              </select>
            </div>

            <div className="account-actions">
              <button className="btn btn-outline" onClick={handleLogout}>
                {t('account.logout')}
              </button>
              {!isSaved ? (
                <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? t('account.saving') : t('account.save')}
                </button>
              ) : (
                <div className="save-success">{t('account.savedSuccess')}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
