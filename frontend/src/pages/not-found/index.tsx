import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h1>{t('notFound.title')}</h1>
      <p>{t('notFound.subtitle')}</p>
      <Link to="/">{t('notFound.goHome')}</Link>
    </div>
  );
};

export default NotFoundPage;
