import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRegister } from '@/shared/api/hooks/auth';
import LangToggle from '@/shared/components/LangToggle';
import type { AxiosError } from 'axios';
import type { ErrorResponse } from '@/shared/api/types/auth';
import './Register.css';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mutate: register, isPending, isError } = useRegister();
  const [registerError, setRegisterError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    register({ name, email, password }, {
      onSuccess: () => {
        navigate('/dashboard');
      },
      onError: (err: unknown) => {
        const error = err as AxiosError<ErrorResponse>;
        setRegisterError(error?.response?.data?.message || t('register.errorDefault'));
      },
    });
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-split">
          <div className="login-split-left">
            <div className="login-brand">
              <h1>MyTravelBuddy</h1>
              <p className="brand-slogan">{t('register.brandSlogan')}</p>
            </div>

            <div className="login-form-container">
              <div className="login-form-header">
                <h2>{t('register.title')}</h2>
                <p>{t('register.subtitle')}</p>
              </div>

              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                  <label htmlFor="name">{t('register.name')}</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">{t('register.email')}</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={isError ? 'error' : ''}
                    aria-describedby={isError ? 'email-error' : undefined}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">{t('register.password')}</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={isError ? 'error' : ''}
                    aria-describedby={isError ? 'password-error' : undefined}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-large btn-full-width"
                  disabled={isPending}
                >
                  {isPending ? t('register.submitting') : t('register.submit')}
                </button>

                {isError && registerError && (
                  <div className="error-message" id="register-error" role="alert">
                    {registerError}
                  </div>
                )}
              </form>

              <div className="login-footer">
                <p>
                  {t('register.hasAccount')} <Link to="/login">{t('register.signIn')}</Link>
                </p>
                <LangToggle />
              </div>
            </div>
          </div>

          <div className="login-split-right">
            <div className="login-visual">
              <div className="visual-content">
                <h2>{t('register.visualTitle')}</h2>
                <p>{t('register.visualSubtitle')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
