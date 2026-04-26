import React from 'react';
import { useTranslation } from 'react-i18next';

const LangToggle: React.FC = () => {
  const { i18n } = useTranslation();

  const toggle = () => {
    const next = i18n.language === 'ru' ? 'en' : 'ru';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  };

  return (
    <button className="lang-switch-btn" onClick={toggle}>
      {i18n.language === 'ru' ? 'English' : 'Русский'}
    </button>
  );
};

export default LangToggle;
